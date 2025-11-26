// ipcHandlers.js
import { ipcMain } from 'electron'

class IPCHandlers {
  constructor(dataStoreManager, wsManager) {
    this.dataStore = dataStoreManager
    this.wsManager = wsManager
    this.handlers = new Map()
  }

  /**
   * 註冊所有 IPC 處理器
   */
  registerAll() {
    // 數據相關處理器
    this.register('get-initial-data', this.handleGetInitialData.bind(this))
    this.register('get-data-slice', this.handleGetDataSlice.bind(this))
    this.register('search-data', this.handleSearchData.bind(this))
    this.register('find-by-id', this.handleFindById.bind(this))
    this.register('get-metadata', this.handleGetMetadata.bind(this))
    this.register('get-all-metadata', this.handleGetAllMetadata.bind(this))
    this.register('get-stats', this.handleGetStats.bind(this))
    this.register('clear-data', this.handleClearData.bind(this))

    // WebSocket 相關處理器
    this.register('get-ws-status', this.handleGetWSStatus.bind(this))
    this.register('get-all-ws-status', this.handleGetAllWSStatus.bind(this))
    this.register('send-ws-message', this.handleSendWSMessage.bind(this))
    this.register('reconnect-ws', this.handleReconnectWS.bind(this))
    this.register('ws-publish', this.handleWSPublish.bind(this))

    // 導出/導入處理器
    this.register('export-data', this.handleExportData.bind(this))
    this.register('import-data', this.handleImportData.bind(this))

    console.log(`✓ Registered ${this.handlers.size} IPC handlers`)
  }

  /**
   * 註冊單個處理器
   */
  register(channel, handler) {
    ipcMain.handle(channel, handler)
    this.handlers.set(channel, handler)
  }

  /**
   * 移除所有處理器
   */
  unregisterAll() {
    this.handlers.forEach((_, channel) => {
      ipcMain.removeHandler(channel)
    })
    this.handlers.clear()
    console.log('✓ Unregistered all IPC handlers')
  }

  // ==================== 數據處理器 ====================

  /**
   * 獲取初始數據
   */
  async handleGetInitialData(event, dataKey) {
    try {
      const data = this.dataStore.getData(dataKey)
      return {
        success: true,
        data,
        count: data.length
      }
    } catch (error) {
      console.error(`Error getting initial data for ${dataKey}:`, error)
      return {
        success: false,
        error: error.message,
        data: []
      }
    }
  }

  /**
   * 獲取數據切片
   */
  async handleGetDataSlice(event, { dataKey, start, end }) {
    try {
      const result = this.dataStore.getDataSlice(dataKey, start, end)
      return {
        success: true,
        ...result
      }
    } catch (error) {
      console.error(`Error getting data slice for ${dataKey}:`, error)
      return {
        success: false,
        error: error.message,
        data: [],
        total: 0
      }
    }
  }

  /**
   * 搜索數據
   */
  async handleSearchData(event, { dataKey, query }) {
    try {
      const results = this.dataStore.search(dataKey, query)
      return {
        success: true,
        results,
        count: results.length
      }
    } catch (error) {
      console.error(`Error searching data in ${dataKey}:`, error)
      return {
        success: false,
        error: error.message,
        results: []
      }
    }
  }

  /**
   * 按 ID 查找
   */
  async handleFindById(event, { dataKey, id }) {
    try {
      const item = this.dataStore.findById(dataKey, id)
      return {
        success: true,
        item: item || null,
        found: !!item
      }
    } catch (error) {
      console.error(`Error finding item by id in ${dataKey}:`, error)
      return {
        success: false,
        error: error.message,
        item: null
      }
    }
  }

  /**
   * 獲取元數據
   */
  async handleGetMetadata(event, dataKey) {
    try {
      const metadata = this.dataStore.getMetadata(dataKey)
      return {
        success: true,
        metadata
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 獲取所有元數據
   */
  async handleGetAllMetadata(event) {
    try {
      const metadata = this.dataStore.getAllMetadata()
      return {
        success: true,
        metadata
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 獲取統計信息
   */
  async handleGetStats(event) {
    try {
      const stats = this.dataStore.getStats()
      return {
        success: true,
        stats
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 清空數據
   */
  async handleClearData(event, dataKey) {
    try {
      const success = this.dataStore.clearData(dataKey)
      return {
        success,
        message: success ? 'Data cleared' : 'Failed to clear data'
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  // ==================== WebSocket 處理器 ====================

  /**
   * 獲取 WebSocket 狀態
   */
  async handleGetWSStatus(event, dataKey) {
    try {
      const status = this.wsManager.getConnectionStatus(dataKey)
      return {
        success: true,
        status
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 獲取所有 WebSocket 狀態
   */
  async handleGetAllWSStatus(event) {
    try {
      const status = this.wsManager.getAllStatus()
      return {
        success: true,
        status
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 發送 WebSocket 消息
   */
  async handleSendWSMessage(event, { dataKey, message }) {
    try {
      const sent = this.wsManager.send(dataKey, message)
      return {
        success: sent,
        message: sent ? 'Message sent' : 'Failed to send message'
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 重連 WebSocket
   */
  async handleReconnectWS(event, { url, dataKey }) {
    try {
      this.wsManager.closeConnection(dataKey)
      this.wsManager.createConnection(url, dataKey)
      return {
        success: true,
        message: 'Reconnecting...'
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 發布數據到數據流
   */
  async handleWSPublish(event, { dataKey, data }) {
    try {
      const success = this.wsManager.publish(dataKey, data)
      return {
        success,
        message: success ? 'Data published' : 'Failed to publish data'
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  // ==================== 導出/導入處理器 ====================

  /**
   * 導出數據
   */
  async handleExportData(event, dataKey) {
    try {
      const exportData = this.dataStore.exportData(dataKey)
      return {
        success: true,
        data: exportData
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 導入數據
   */
  async handleImportData(event, { dataKey, data }) {
    try {
      const success = this.dataStore.importData(dataKey, data)
      return {
        success,
        message: success ? 'Data imported' : 'Failed to import data'
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }
}

export default IPCHandlers
