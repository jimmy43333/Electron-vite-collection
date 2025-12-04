import { ipcMain, app } from 'electron'
import { join } from 'path'
import fs from 'fs'
import { myvariable } from '../../data/my_variable.js'
import * as jsonStorage from '../jsonStorage.js'

/**
 * 註冊外部配置相關的 IPC handlers
 */
export function registerExternalConfigHandlers() {
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

  // 獲取外部配置
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
        const configPath = join(basePath, 'resources', 'data', 'config.json')
        console.log(`Reading default base config from: ${configPath}`)
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

  // 儲存外部配置
  ipcMain.handle('saveExternalConfig', async (event, updatedConfig) => {
    return await jsonStorage.setElectronJsonStorage('external-config', updatedConfig)
  })
}
