const os = require('os')

export const myvariable = {
  folder: `${os.homedir()}/Desktop/Electron-vite-collection`,
  get log_folder() {
    return `${this.folder}`
  }
}
