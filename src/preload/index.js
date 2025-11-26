import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // ==================== 數據相關 API ====================

  /**
   * 獲取初始數據
   */
  getInitialData: (dataKey) => {
    return ipcRenderer.invoke('get-initial-data', dataKey)
  },

  /**
   * 獲取數據切片（用於虛擬列表）
   */
  getDataSlice: (params) => {
    return ipcRenderer.invoke('get-data-slice', params)
  },

  /**
   * 搜索數據
   */
  searchData: (params) => {
    return ipcRenderer.invoke('search-data', params)
  },

  /**
   * 按 ID 查找
   */
  findById: (params) => {
    return ipcRenderer.invoke('find-by-id', params)
  },

  /**
   * 獲取元數據
   */
  getMetadata: (dataKey) => {
    return ipcRenderer.invoke('get-metadata', dataKey)
  },

  /**
   * 獲取所有元數據
   */
  getAllMetadata: () => {
    return ipcRenderer.invoke('get-all-metadata')
  },

  /**
   * 獲取統計信息
   */
  getStats: () => {
    return ipcRenderer.invoke('get-stats')
  },

  /**
   * 清空數據
   */
  clearData: (dataKey) => {
    return ipcRenderer.invoke('clear-data', dataKey)
  },

  // ==================== WebSocket 相關 API ====================

  /**
   * 獲取 WebSocket 狀態
   */
  getWSStatus: (dataKey) => {
    return ipcRenderer.invoke('get-ws-status', dataKey)
  },

  /**
   * 獲取所有 WebSocket 狀態
   */
  getAllWSStatus: () => {
    return ipcRenderer.invoke('get-all-ws-status')
  },

  /**
   * 發送 WebSocket 消息
   */
  sendWSMessage: (params) => {
    return ipcRenderer.invoke('send-ws-message', params)
  },

  /**
   * 重連 WebSocket
   */
  reconnectWS: (params) => {
    return ipcRenderer.invoke('reconnect-ws', params)
  },

  /**
   * 發布數據到數據流
   */
  publishData: (params) => {
    return ipcRenderer.invoke('ws-publish', params)
  },

  // ==================== 導出/導入 API ====================

  /**
   * 導出數據
   */
  exportData: (dataKey) => {
    return ipcRenderer.invoke('export-data', dataKey)
  },

  /**
   * 導入數據
   */
  importData: (params) => {
    return ipcRenderer.invoke('import-data', params)
  },

  // ==================== 事件監聽 API ====================

  /**
   * 監聽數據更新
   */
  onDataUpdate: (dataKey, callback) => {
    const channel = `${dataKey}-update`
    const listener = (event, data) => callback(data)
    ipcRenderer.on(channel, listener)

    // 返回取消監聽函數
    return () => {
      ipcRenderer.removeListener(channel, listener)
    }
  },

  /**
   * 監聽批量更新進度
   */
  onBatchProgress: (callback) => {
    const listener = (event, data) => callback(data)
    ipcRenderer.on('batch-progress', listener)

    return () => {
      ipcRenderer.removeListener('batch-progress', listener)
    }
  },

  /**
   * 監聽 WebSocket 狀態變化
   */
  onWSStatus: (callback) => {
    const listener = (event, data) => callback(data)
    ipcRenderer.on('ws-status', listener)

    return () => {
      ipcRenderer.removeListener('ws-status', listener)
    }
  },

  /**
   * 監聽 WebSocket 錯誤
   */
  onWSError: (callback) => {
    const listener = (event, data) => callback(data)
    ipcRenderer.on('ws-error', listener)

    return () => {
      ipcRenderer.removeListener('ws-error', listener)
    }
  },

  /**
   * 監聽 WebSocket 重連失敗
   */
  onWSReconnectFailed: (callback) => {
    const listener = (event, data) => callback(data)
    ipcRenderer.on('ws-reconnect-failed', listener)

    return () => {
      ipcRenderer.removeListener('ws-reconnect-failed', listener)
    }
  },

  /**
   * 移除所有特定 dataKey 的監聽器
   */
  removeDataListeners: (dataKey) => {
    ipcRenderer.removeAllListeners(`${dataKey}-update`)
  },

  /**
   * 移除所有監聽器（清理用）
   */
  removeAllListeners: () => {
    ;['data1', 'data2', 'data3', 'data4'].forEach((key) => {
      ipcRenderer.removeAllListeners(`${key}-update`)
    })
    ipcRenderer.removeAllListeners('batch-progress')
    ipcRenderer.removeAllListeners('ws-status')
    ipcRenderer.removeAllListeners('ws-error')
    ipcRenderer.removeAllListeners('ws-reconnect-failed')
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}

// 在窗口卸載時清理所有監聽器
window.addEventListener('beforeunload', () => {
  if (window.api?.removeAllListeners) {
    window.api.removeAllListeners()
  }
})
