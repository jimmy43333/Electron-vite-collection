// 會話管理器 - 業務邏輯層
import path from 'path'
import fs from 'fs'
import { EventEmitter } from 'events'
import { SQLiteDatabase } from './sqliteDatabase.js'
import { META_DB_SCHEMA, SESSION_DB_SCHEMA } from './dbSchemas.js'
import { SESSION_STATUS, generateSessionId } from './sessionTypes.js'

/**
 * 會話管理器類別
 * 負責管理測試會話的生命週期、資料存儲和輪轉邏輯
 */
export class SessionManager extends EventEmitter {
  constructor(workspace_key) {
    super()

    this.workspace_key = workspace_key
    this.dataDir = path.join(process.cwd(), 'data', 'sessions', workspace_key)

    // 確保資料目錄存在
    this.ensureDataDirectory()

    // 初始化 Meta 資料庫
    const metaDbPath = path.join(this.dataDir, 'meta.db')
    this.meta_db = new SQLiteDatabase(metaDbPath)

    // 創建 Meta 資料庫表結構
    this.initializeMetaDatabase()

    // 單一會話管理（一次只能開啟一個會話）
    this.currentSessionId = null // 當前活躍的會話ID
    this.currentSessionDb = null // 當前會話資料庫

    console.log(`📋 SessionManager 初始化完成: ${workspace_key}`)
  }

  /**
   * 確保資料目錄存在
   * @private
   */
  ensureDataDirectory() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true })
      console.log(`📁 已創建資料目錄: ${this.dataDir}`)
    }
  }

  /**
   * 檢查是否有活躍會話
   * @returns {boolean} 是否有活躍會話
   */
  hasActiveSession() {
    return this.currentSessionId !== null && this.currentSessionDb !== null
  }

  /**
   * 初始化 Meta 資料庫
   * @private
   */
  async initializeMetaDatabase() {
    try {
      await this.meta_db.createTables(META_DB_SCHEMA)
      await this.meta_db.printTableSchema('sessions')
      console.log(`✅ Meta 資料庫初始化完成`)
    } catch (error) {
      console.error(`❌ Meta 資料庫初始化失敗:`, error)
      throw error
    }
  }

  /**
   * 創建測試會話（單一會話模式）
   * @param {string} session_id - 會話ID（可選，若不提供則自動生成）
   * @returns {Promise<string>} 會話ID
   */
  async createTestSession(session_id = null) {
    try {
      // 檢查是否已有活躍會話
      if (this.hasActiveSession()) {
        throw new Error(`已存在活躍會話 ${this.currentSessionId}，請先關閉當前會話`)
      }

      // 如果沒有提供 session_id，自動生成一個
      if (!session_id) {
        session_id = generateSessionId()
      }

      // 創建會話資料庫
      const sessionDbPath = path.join(this.dataDir, `session_${session_id}.db`)
      const session_db = new SQLiteDatabase(sessionDbPath)

      // 創建會話資料庫表結構
      await session_db.createTables(SESSION_DB_SCHEMA)

      // 設置 WebSocket 資料表的輪轉配置（每個表最多 10000 條記錄）
      if (SESSION_DB_SCHEMA.websocket_data) {
        session_db.setTableRotationConfig('websocket_data', 10000, SESSION_DB_SCHEMA.websocket_data)
      }

      // 創建會話 meta 表（用於在會話資料庫中也存一份 meta 資料）
      const sessionMetaSchema = {
        [`${session_id}_meta`]: {
          columns: {
            key: { type: 'TEXT', primary: true, notNull: true },
            value: { type: 'TEXT' },
            updatedAt: { type: 'INTEGER', notNull: true }
          }
        }
      }
      await session_db.createTables(sessionMetaSchema)

      // 設置當前活躍會話
      this.currentSessionId = session_id
      this.currentSessionDb = session_db

      // 在 Meta 資料庫中記錄會話資訊
      const currentTime = new Date().toISOString()
      await this.meta_db.insert('sessions', {
        sessionId: session_id,
        testName: `Test Session ${session_id}`,
        description: '',
        status: SESSION_STATUS.CREATED,
        testStartTime: currentTime,
        dbPath: sessionDbPath,
        workspace: this.workspace_key,
        createdAt: currentTime,
        updatedAt: currentTime
      })
      // 在會話資料庫中也存一份基本 meta 資料
      await this.updateMetaData({
        sessionId: session_id,
        status: SESSION_STATUS.CREATED,
        workspace: this.workspace_key
      })

      console.log(`✅ 測試會話已創建: ${session_id}`)
      this.emit('sessionCreated', { sessionId: session_id })

      return session_id
    } catch (error) {
      console.error(`❌ 創建測試會話失敗:`, error)
      throw error
    }
  }

  /**
   * 更新會話資料
   * @param {Object} data - WebSocket 資料
   */
  async updateSessionData(data) {
    try {
      // 檢查是否有活躍會話
      if (!this.hasActiveSession()) {
        throw new Error(`沒有活躍會話，無法更新會話資料`)
      }
      console.log(data)

      const session_db = this.currentSessionDb
      const session_id = this.currentSessionId

      // 添加時間戳和會話ID
      const websocketData = {
        sessionId: session_id,
        timestamp: data.timestamp || Date.now(),
        type: data.type || 'message',
        data: typeof data.data === 'string' ? data.data : JSON.stringify(data.data),
        direction: data.direction || 'unknown',
        size: data.size || (data.data ? JSON.stringify(data.data).length : 0)
      }

      // 插入到輪轉表中（會自動處理輪轉）
      const result = await session_db.insert('websocketData', websocketData)

      console.log(`📝 WebSocket 資料已更新: ${session_id} -> ${result.tableName}`)
      this.emit('websocketDataUpdated', {
        sessionId: session_id,
        tableName: result.tableName,
        data: websocketData
      })

      return result
    } catch (error) {
      console.error(`❌ 更新 WebSocket 資料失敗:`, error)
      throw error
    }
  }

  /**
   * 更新 Meta 資料
   * @param {Object} data - Meta 資料
   */
  async updateMetaData(data) {
    try {
      // 檢查是否有活躍會話
      if (!this.hasActiveSession()) {
        throw new Error(`沒有活躍會話，無法更新 Meta 資料`)
      }

      const session_id = this.currentSessionId
      const updateTime = new Date().toISOString()

      // 1. 更新 Meta 資料庫中的 sessions 表
      if (data.sessionId || data.testName || data.description || data.status || data.result) {
        const metaUpdates = {}
        if (data.testName !== undefined) metaUpdates.testName = data.testName
        if (data.description !== undefined) metaUpdates.description = data.description
        if (data.status !== undefined) metaUpdates.status = data.status
        if (data.result !== undefined) metaUpdates.result = data.result
        if (data.endTime !== undefined) metaUpdates.testEndTime = data.endTime
        if (data.testEndTime !== undefined) metaUpdates.testEndTime = data.testEndTime
        if (data.summary !== undefined) metaUpdates.summary = JSON.stringify(data.summary)

        metaUpdates.updatedAt = updateTime

        await this.meta_db.update('sessions', metaUpdates, { sessionId: session_id })
      }

      // 2. 更新會話資料庫中的 meta 表
      const session_db = this.currentSessionDb
      const metaTableName = `${session_id}_meta`

      // 將所有 meta 資料以鍵值對形式存儲
      for (const [key, value] of Object.entries(data)) {
        const metaData = {
          key: key,
          value: typeof value === 'string' ? value : JSON.stringify(value),
          updatedAt: Date.now()
        }

        try {
          // 嘗試更新現有記錄
          await session_db.update(
            metaTableName,
            { value: metaData.value, updatedAt: metaData.updatedAt },
            { key: key }
          )
        } catch (updateError) {
          // 如果更新失敗（記錄不存在），則插入新記錄
          await session_db.insert(metaTableName, metaData)
        }
      }

      console.log(`📊 Meta 資料已更新: ${session_id}`)
      this.emit('metaDataUpdated', { sessionId: session_id, data })
    } catch (error) {
      console.error(`❌ 更新 Meta 資料失敗:`, error)
      throw error
    }
  }

  /**
   * 獲取當前會話資訊
   * @returns {Promise<Object>} 當前會話資訊
   */
  async getSessionInfo() {
    try {
      // 檢查是否有活躍會話
      if (!this.hasActiveSession()) {
        throw new Error('沒有活躍會話，無法獲取會話資訊')
      }

      const session_id = this.currentSessionId

      // 從 Meta 資料庫獲取基本資訊
      const sessionInfo = await this.meta_db.select(
        'sessions',
        { sessionId: session_id },
        { single: true }
      )

      if (!sessionInfo) {
        throw new Error(`會話 ${session_id} 不存在`)
      }

      // 如果會話資料庫可用，獲取統計資訊
      if (this.currentSessionDb) {
        const session_db = this.currentSessionDb
        // 獲取 WebSocket 資料統計
        const websocketStats = await session_db.getTableRotationStats('websocket_data')
        sessionInfo.websocketStats = websocketStats

        // 獲取會話 meta 資料
        const metaTableName = `${session_id}_meta`
        try {
          const sessionMeta = await session_db.select(metaTableName)
          sessionInfo.sessionMeta = sessionMeta.reduce((acc, item) => {
            try {
              acc[item.key] = JSON.parse(item.value)
            } catch {
              acc[item.key] = item.value
            }
            return acc
          }, {})
        } catch (metaError) {
          console.warn(`獲取會話 meta 資料時發生錯誤:`, metaError.message)
        }
      }

      return sessionInfo
    } catch (error) {
      console.error(`❌ 獲取會話資訊失敗:`, error)
      throw error
    }
  }

  /**
   * 關閉當前活躍會話
   */
  closeTestSession() {
    if (this.currentSessionDb) {
      this.currentSessionDb.close()
      console.log(`🔒 會話資料庫已關閉: ${this.currentSessionId}`)

      this.currentSessionId = null
      this.currentSessionDb = null
    }
  }

  /**
   * 關閉所有資料庫連接
   */
  closeAll() {
    // 關閉當前會話資料庫
    if (this.currentSessionDb) {
      this.currentSessionDb.close()
      console.log(`🔒 會話資料庫已關閉: ${this.currentSessionId}`)
      this.currentSessionId = null
      this.currentSessionDb = null
    }

    // 關閉 Meta 資料庫
    this.meta_db.close()
    console.log(`🔒 Meta 資料庫已關閉`)
  }

  /**
   * 獲取當前活躍會話ID
   * @returns {string|null} 當前活躍的會話ID
   */
  getCurrentSessionId() {
    return this.currentSessionId
  }

  /**
   * 強制關閉當前會話並創建新會話
   * @param {string} session_id - 新會話ID（可選，若不提供則自動生成）
   * @returns {Promise<string>} 新會話ID
   */
  async forceCreateSession(session_id = null) {
    // 強制關閉當前會話
    if (this.hasActiveSession()) {
      console.log(`⚠️ 強制關閉活躍會話: ${this.currentSessionId}`)
      this.closeSession()
    }

    // 創建新會話
    return await this.createTestSession(session_id)
  }

  /**
   * 更新 WebSocket 資料（與 WebSocketClient 相容的介面）
   * @param {Object} data - WebSocket 資料
   */
  async updateWebsocketData(data) {
    try {
      if (!this.hasActiveSession()) {
        throw new Error('沒有活躍會話，無法更新 WebSocket 資料')
      }
      if (Buffer.isBuffer(data)) {
        data = data.toString()
      }

      return await this.updateSessionData(data)
    } catch (error) {
      console.error(`❌ 更新 WebSocket 資料失敗:`, error)
      throw error
    }
  }
}
