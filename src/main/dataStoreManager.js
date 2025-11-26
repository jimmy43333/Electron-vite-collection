// dataStoreManager.js
import { EventEmitter } from 'events'

class DataStoreManager extends EventEmitter {
  constructor(dataKeys = []) {
    super()
    this.stores = new Map()
    this.metadata = new Map()

    // 初始化數據存儲
    dataKeys.forEach((key) => {
      this.stores.set(key, [])
      this.metadata.set(key, {
        lastUpdate: null,
        updateCount: 0,
        totalItems: 0
      })
    })
  }

  /**
   * 獲取完整數據
   */
  getData(dataKey) {
    return this.stores.get(dataKey) || []
  }

  /**
   * 獲取數據切片
   */
  getDataSlice(dataKey, start = 0, end = 100) {
    const data = this.stores.get(dataKey) || []
    return {
      data: data.slice(start, end),
      total: data.length,
      start,
      end: Math.min(end, data.length)
    }
  }

  /**
   * 設置完整數據
   */
  setData(dataKey, data) {
    if (!this.stores.has(dataKey)) {
      console.warn(`DataKey ${dataKey} does not exist`)
      return false
    }

    this.stores.set(dataKey, Array.isArray(data) ? data : [])
    this.updateMetadata(dataKey, 'full')
    this.emit('data-updated', { dataKey, type: 'full', count: data.length })

    return true
  }

  /**
   * 處理增量更新
   */
  handleUpdate(dataKey, updates) {
    if (!this.stores.has(dataKey)) {
      console.warn(`DataKey ${dataKey} does not exist`)
      return false
    }

    const store = this.stores.get(dataKey)
    const updateResults = {
      updated: 0,
      inserted: 0,
      deleted: 0
    }

    if (Array.isArray(updates)) {
      updates.forEach((update) => {
        if (update.action === 'delete') {
          const index = store.findIndex((item) => item.id === update.id)
          if (index !== -1) {
            store.splice(index, 1)
            updateResults.deleted++
          }
        } else {
          const index = store.findIndex((item) => item.id === update.id)
          if (index !== -1) {
            // 更新現有項目
            store[index] = { ...store[index], ...update }
            updateResults.updated++
          } else {
            // 插入新項目
            store.push(update)
            updateResults.inserted++
          }
        }
      })
    }

    this.updateMetadata(dataKey, 'incremental', updateResults)
    this.emit('data-updated', {
      dataKey,
      type: 'incremental',
      results: updateResults,
      total: store.length
    })

    return updateResults
  }

  /**
   * 批量更新（優化性能）
   */
  batchUpdate(dataKey, updates, batchSize = 1000) {
    if (!this.stores.has(dataKey)) {
      console.warn(`DataKey ${dataKey} does not exist`)
      return false
    }

    const totalUpdates = updates.length
    let processedCount = 0

    // 分批處理
    for (let i = 0; i < totalUpdates; i += batchSize) {
      const batch = updates.slice(i, i + batchSize)
      this.handleUpdate(dataKey, batch)
      processedCount += batch.length

      // 每批次後發送進度
      this.emit('batch-progress', {
        dataKey,
        processed: processedCount,
        total: totalUpdates,
        progress: ((processedCount / totalUpdates) * 100).toFixed(2)
      })
    }

    return true
  }

  /**
   * 搜索數據
   */
  search(dataKey, query) {
    const data = this.stores.get(dataKey) || []

    if (typeof query === 'function') {
      // 自定義查詢函數
      return data.filter(query)
    }

    if (typeof query === 'object' && query !== null) {
      // 對象匹配
      return data.filter((item) => {
        return Object.keys(query).every((key) => item[key] === query[key])
      })
    }

    return []
  }

  /**
   * 按 ID 查找單個項目
   */
  findById(dataKey, id) {
    const data = this.stores.get(dataKey) || []
    return data.find((item) => item.id === id)
  }

  /**
   * 清空數據
   */
  clearData(dataKey) {
    if (this.stores.has(dataKey)) {
      this.stores.set(dataKey, [])
      this.updateMetadata(dataKey, 'clear')
      this.emit('data-cleared', { dataKey })
      return true
    }
    return false
  }

  /**
   * 清空所有數據
   */
  clearAll() {
    this.stores.forEach((_, dataKey) => {
      this.stores.set(dataKey, [])
      this.updateMetadata(dataKey, 'clear')
    })
    this.emit('all-data-cleared')
  }

  /**
   * 更新元數據
   */
  updateMetadata(dataKey, updateType, details = {}) {
    const meta = this.metadata.get(dataKey)
    if (meta) {
      meta.lastUpdate = new Date().toISOString()
      meta.updateCount++
      meta.totalItems = this.stores.get(dataKey).length
      meta.lastUpdateType = updateType
      meta.lastUpdateDetails = details
    }
  }

  /**
   * 獲取元數據
   */
  getMetadata(dataKey) {
    return this.metadata.get(dataKey)
  }

  /**
   * 獲取所有元數據
   */
  getAllMetadata() {
    const allMeta = {}
    this.metadata.forEach((meta, key) => {
      allMeta[key] = { ...meta }
    })
    return allMeta
  }

  /**
   * 獲取統計信息
   */
  getStats() {
    const stats = {
      totalStores: this.stores.size,
      stores: {}
    }

    this.stores.forEach((data, key) => {
      const meta = this.metadata.get(key)
      stats.stores[key] = {
        itemCount: data.length,
        lastUpdate: meta?.lastUpdate,
        updateCount: meta?.updateCount
      }
    })

    return stats
  }

  /**
   * 導出數據（用於備份或調試）
   */
  exportData(dataKey) {
    const data = this.stores.get(dataKey)
    const meta = this.metadata.get(dataKey)

    return {
      dataKey,
      data,
      metadata: meta,
      exportTime: new Date().toISOString()
    }
  }

  /**
   * 導入數據
   */
  importData(dataKey, exportedData) {
    if (exportedData.dataKey !== dataKey) {
      console.warn('DataKey mismatch in import')
      return false
    }

    this.setData(dataKey, exportedData.data)
    return true
  }
}

export default DataStoreManager
