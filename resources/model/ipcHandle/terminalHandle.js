import { ipcMain } from 'electron'
import Logger from '../logger.js'
import FileWatcher from '../fileWatcher.js'
import { myvariable } from '../../data/my_variable.js'

const logger = new Logger().log.scope('main')

/**
 * 註冊終端機相關的 IPC handlers
 * @param {BrowserWindow} mainWindow - 主視窗實例
 */
export function registerTerminalHandlers(mainWindow) {
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
