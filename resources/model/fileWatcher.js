import { readFile } from 'fs'
import { Tail } from 'tail'
import chokidar from 'chokidar'

class FileWatcher {
  constructor(webContents) {
    this.webContents = webContents
    this.currentWatcher = null
    this.currentTail = null
    this.retryTimer = null
  }

  start_watch(filePath, channel = 'update_refresh') {
    let fileContent = ''
    this.currentWatcher = chokidar.watch(filePath, {
      // ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true
    })
    this.currentWatcher.on('change', () => {
      setTimeout(async () => {
        readFile(filePath, 'utf-8', (err, data) => {
          if (!err) {
            fileContent = data.replaceAll('\n', '\n\r')
            fileContent = '\x1b[H' + fileContent
            data = data.replaceAll('\n', '\n\r')
            this.webContents.send(channel, data)
          }
        })
      }, 500)
    })
    return this.currentWatcher
  }

  stop_watch() {
    if (this.currentWatcher) {
      this.currentWatcher.close()
      this.currentWatcher = null
    }
  }

  start_tail(filePath, channel = 'update_append') {
    if (this.currentTail) this.currentTail.unwatch()
    this.currentTail = new Tail(filePath)
    this.currentTail.on('line', (data) => {
      this.webContents.send(channel, `${data}\n\r`)
    })
    this.currentTail.on('error', (err) => {
      console.error('Tail error:', err)
      if (this.currentTail) {
        this.webContents.send(channel, `\x1b[2J\x1b[H\x1b[1;31mTail File Error !!\x1b[0m\n\r`)
        this.currentTail.unwatch()
        this.currentTail = null
        this.retryTimer = setTimeout(() => this.start_tail(filePath), 5000)
      }
    })
  }

  stop_tail() {
    if (this.retryTimer) clearTimeout(this.retryTimer)
    if (this.currentTail) {
      this.currentTail.unwatch()
      this.currentTail = null
    }
  }
}

export default FileWatcher
