import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import fs from 'fs'
import { myvariable } from '../../resources/data/my_variable.js'
import Logger from '../../resources/model/logger.js'
import FileWatcher from '../../resources/model/fileWatcher.js'
import * as jsonStorage from '../../resources/model/jsonStorage.js'
import registerRunPythonHandler from '../../resources/model/runPython.js'

import WebSocketManager from './websocketManager.js'
import DataStoreManager from './dataStoreManager.js'
import IPCHandlers from './ipcHandlers.js'

// Add global error handling for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  // Application specific logging, throwing an error, or other logic here
})

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  // Application specific logging, throwing an error, or other logic here
})

const logger = new Logger().log.scope('main')
let mainWindow
let wsManager
let dataStore
let ipcHandlers

// WebSocket 配置
const WS_CONFIG = [
  { url: 'ws://localhost:8765', dataKey: 'data1' },
  { url: 'ws://localhost:8765', dataKey: 'data2' },
  { url: 'ws://localhost:8765', dataKey: 'data3' }
]

const DATA_KEYS = ['data1', 'data2', 'data3']

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.setResizable(false)

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

/**
 * 初始化數據存儲
 */
function initDataStore() {
  console.log('Initializing data store...')
  dataStore = new DataStoreManager(DATA_KEYS)

  // 監聽數據更新事件
  dataStore.on('data-updated', ({ dataKey, type, count, results }) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(`${dataKey}-update`, {
        type,
        count: count || results?.updated + results?.inserted,
        results,
        timestamp: new Date().toISOString()
      })
    }
  })

  dataStore.on('batch-progress', (progress) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('batch-progress', progress)
    }
  })

  console.log('✓ Data store initialized')
  return dataStore
}

/**
 * 初始化 WebSocket 管理器
 */
function initWebSocketManager() {
  console.log('Initializing WebSocket manager...')

  wsManager = new WebSocketManager({
    reconnectInterval: 5000,
    maxReconnectAttempts: 10,
    pingInterval: 30000
  })

  // 監聽連接事件
  wsManager.on('connected', ({ dataKey }) => {
    console.log(`✓ ${dataKey} connected`)
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('ws-status', { dataKey, status: 'connected' })
    }
  })

  // 監聽消息事件
  wsManager.on('message', ({ dataKey, data }) => {
    handleWebSocketMessage(dataKey, data)
  })

  // 監聽錯誤事件
  wsManager.on('error', ({ dataKey, error }) => {
    console.error(`WebSocket ${dataKey} error:`, error)
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('ws-error', { dataKey, error })
    }
  })

  // 監聽關閉事件
  wsManager.on('closed', ({ dataKey }) => {
    console.log(`${dataKey} disconnected`)
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('ws-status', { dataKey, status: 'disconnected' })
    }
  })

  // 監聽重連失敗事件
  wsManager.on('reconnect-failed', ({ dataKey }) => {
    console.error(`${dataKey} reconnect failed`)
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('ws-reconnect-failed', { dataKey })
    }
  })

  // 初始化所有連接
  wsManager.initConnections(WS_CONFIG)

  console.log('✓ WebSocket manager initialized')
  return wsManager
}

/**
 * 處理 WebSocket 消息
 */
function handleWebSocketMessage(dataKey, data) {
  try {
    if (data.type === 'full') {
      // 完整數據替換
      dataStore.setData(dataKey, data.data)
      console.log(`Full data update for ${dataKey}: ${data.data?.length} items`)
    } else if (data.type === 'update' || data.type === 'incremental') {
      // 增量更新
      const results = dataStore.handleUpdate(dataKey, data.updates || data.data)
      console.log(`Incremental update for ${dataKey}:`, results)
    } else if (data.type === 'batch') {
      // 批量更新
      dataStore.batchUpdate(dataKey, data.updates || data.data)
    } else {
      console.warn(`Unknown message type for ${dataKey}:`, data.type)
    }
  } catch (error) {
    console.error(`Error handling WebSocket message for ${dataKey}:`, error)
  }
}

/**
 * 初始化 IPC 處理器
 */
function initIPCHandlers() {
  console.log('Initializing IPC handlers...')
  ipcHandlers = new IPCHandlers(dataStore, wsManager)
  ipcHandlers.registerAll()
  return ipcHandlers
}

/**
 * 清理資源
 */
function cleanup() {
  console.log('Cleaning up resources...')

  if (wsManager) {
    wsManager.closeAll()
  }

  if (ipcHandlers) {
    ipcHandlers.unregisterAll()
  }

  if (dataStore) {
    dataStore.removeAllListeners()
  }

  console.log('✓ Cleanup complete')
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // 初始化各個模組
  initDataStore()
  initWebSocketManager()
  initIPCHandlers()

  // IPC test
  createWindow()
  IPChandlers()
  registerRunPythonHandler()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  cleanup()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 應用退出前清理
app.on('before-quit', () => {
  cleanup()
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
function IPChandlers() {
  // maximum
  ipcMain.on('maximum', () => {
    console.log('Maximum')
    mainWindow.setFullScreen(true)
    mainWindow.setResizable(true)
  })

  // ping
  ipcMain.on('ping', () => console.log('pong'))

  // save log
  ipcMain.on('save_log', () => {
    logger.info('This is an info log')
    logger.error('This is an error log')
  })

  // terminal
  let file_watcher = new FileWatcher(mainWindow.webContents)
  let log_timer = null
  ipcMain.on('terminal_control', (event, command, tag) => {
    logger.info(`Received command: ${tag} ${command}`)
    if (tag === 'Stop' || command === 'stop') {
      // Stop the watcher if it exists
      logger.info(`Stop watcher !!`)
      file_watcher.stop_watch()
      file_watcher.stop_tail()
      if (log_timer) {
        clearInterval(log_timer)
        log_timer = null
      }
      event.reply('terminal_response', `Watcher stopped`)
    }
    if (tag === 'Refresh' && command === 'start') {
      logger.info(`Start watcher !!`)
      const logPath = `${myvariable.log_folder}/Desktop-GUI.log`
      file_watcher.start_watch(logPath)
    }
    if (tag === 'Append' && command === 'start') {
      logger.info(`Start tailing log !!`)
      const logPath = `${myvariable.log_folder}/Desktop-GUI.log`
      file_watcher.start_tail(logPath)
      // Keep writing to the log file
      if (log_timer) {
        clearInterval(log_timer)
        log_timer = null
      }
      log_timer = setInterval(() => {
        logger.info('Timer log entry at ' + new Date().toISOString())
      }, 2000)
    }
    event.reply('terminal_response', `Command received: ${command}`)
  })

  // electron-json-storage
  ipcMain.on('get_electron_json_storage', async (event, key) => {
    event.returnValue = await jsonStorage.getElectronJsonStorage(key)
  })

  ipcMain.on('set_electron_json_storage', async (event, key, data) => {
    let dataToSave = JSON.parse(data)
    event.returnValue = await jsonStorage.setElectronJsonStorage(key, dataToSave)
  })

  ipcMain.on('remove_electron_json_storage', async (event, key) => {
    event.returnValue = await jsonStorage.removeElectronJsonStorage(key)
  })

  // 只更新 A 有的 key，B 的值覆蓋 A
  function updateAWithB(a, b) {
    for (const key in a) {
      if (Object.prototype.hasOwnProperty.call(b, key)) {
        // 如果是物件，遞迴處理
        if (
          typeof a[key] === 'object' &&
          a[key] !== null &&
          typeof b[key] === 'object' &&
          b[key] !== null
        ) {
          updateAWithB(a[key], b[key])
        } else {
          a[key] = b[key]
        }
      }
    }
    return a
  }

  ipcMain.handle('getExternalConfig', async () => {
    let base_data = null
    let output_data = null
    const basePath = app.isPackaged ? app.getAppPath() : process.cwd()
    const projectDefault = `${myvariable.log_folder}/data/config.json`
    // Check if the default config file exists
    if (fs.existsSync(projectDefault)) {
      try {
        console.log('Reading external project base config from:', projectDefault)
        base_data = JSON.parse(fs.readFileSync(projectDefault, 'utf-8'))
      } catch (error) {
        console.error(`Error reading external config file:`, error)
      }
    } else {
      try {
        console.log(`Reading default base config from: ${configPath}`)
        const configPath = join(basePath, 'resources', 'data', 'config.json')
        base_data = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
      } catch (error) {
        console.error(`Error reading default config file:`, error)
      }
    }
    const exists = await jsonStorage.hasElectronJsonStorage('external-config')
    if (exists && base_data) {
      console.log('Reading external config from electron-json-storage')
      output_data = await jsonStorage.getElectronJsonStorage('external-config')
      output_data = updateAWithB(base_data, output_data)
      return output_data
    } else if (base_data) {
      return base_data
    }
  })

  ipcMain.handle('saveExternalConfig', async (event, updatedConfig) => {
    // let dataToSave = JSON.parse(updatedConfig)
    return await jsonStorage.setElectronJsonStorage('external-config', updatedConfig)
  })
}
