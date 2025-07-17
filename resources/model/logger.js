const log = require('electron-log')
import { myvariable } from '../../resources/data/my_variable.js'

// log.transports.file.resolvePathFn = () => path.join(__dirname, 'ats_desktop.log')

class Logger {
  constructor() {
    const folder_path = `${myvariable.log_folder}/Desktop-GUI.log`
    this.log = log
    this.log.transports.file.resolvePathFn = () => folder_path
    this.log.transports.file.format = '{y}-{m}-{d} {h}:{i}:{s} {scope} | {text}'
    this.log.transports.file.level = process.env.NODE_ENV === 'test' ? false : 'info'
    this.log.transports.console.level = false
  }
}

export default Logger
