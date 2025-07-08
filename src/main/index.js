import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { myvariable } from '../../resources/data/my_variable.js'
import Logger from '../../resources/model/logger.js'
import FileWatcher from '../../resources/model/fileWatcher.js'

const logger = new Logger().log.scope('main')
let mainWindow

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
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

  // IPC test
  createWindow()
  IPChandlers()

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
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
function IPChandlers() {
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
}
