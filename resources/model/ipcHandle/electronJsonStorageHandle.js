import { ipcMain } from 'electron'
import * as jsonStorage from '../jsonStorage.js'

/**
 * 註冊 Electron JSON Storage 相關的 IPC handlers
 */
export function registerElectronJsonStorageHandlers() {
  // 獲取 electron-json-storage 資料
  ipcMain.on('get_electron_json_storage', async (event, key) => {
    event.returnValue = await jsonStorage.getElectronJsonStorage(key)
  })

  // 設定 electron-json-storage 資料
  ipcMain.on('set_electron_json_storage', async (event, key, data) => {
    let dataToSave = JSON.parse(data)
    event.returnValue = await jsonStorage.setElectronJsonStorage(key, dataToSave)
  })

  // 移除 electron-json-storage 資料
  ipcMain.on('remove_electron_json_storage', async (event, key) => {
    event.returnValue = await jsonStorage.removeElectronJsonStorage(key)
  })
}
