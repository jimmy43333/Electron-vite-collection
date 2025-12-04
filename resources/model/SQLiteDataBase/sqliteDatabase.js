// SQLite 資料庫操作層 - 單一資料庫實例管理
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

export class SQLiteDatabase {
  constructor(dbPath) {
    this.dbPath = dbPath
    this.db = null
    this.statements = new Map() // 預編譯語句快取
    this.isConnected = false
    // 表輪轉配置
    this.tableRotationConfig = new Map() // 存儲每個表的輪轉配置
    this.currentTableIndexes = new Map() // 存儲當前表索引

    // 自動連接資料庫
    this.connect()
  }

  /**
   * 連接到資料庫
   * @private
   */
  connect() {
    if (this.isConnected) {
      return this.db
    }

    try {
      // 確保目錄存在
      const dir = path.dirname(this.dbPath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }

      // 創建資料庫連接
      this.db = new Database(this.dbPath)

      // 優化設定
      this.db.pragma('journal_mode = WAL')
      this.db.pragma('synchronous = NORMAL')
      this.db.pragma('cache_size = 32000')
      this.db.pragma('temp_store = MEMORY')
      this.db.defaultSafeIntegers(true)

      this.isConnected = true
      console.log(`📂 資料庫連接已開啟: ${this.dbPath}`)

      return this.db
    } catch (error) {
      console.error(`❌ 資料庫連接失敗: ${this.dbPath}`, error)
      throw error
    }
  }

  /**
   * 獲取資料庫連接
   * @returns {Database} 資料庫連接
   */
  getConnection() {
    if (!this.isConnected) {
      this.connect()
    }
    return this.db
  }

  /**
   * 創建表結構
   * @param {Object} schema - 資料庫結構定義
   */
  async createTables(schema) {
    const db = this.getConnection()

    // 創建所有表
    for (const [tableName, tableSchema] of Object.entries(schema)) {
      const sql = this.generateCreateTableSQL(tableName, tableSchema)
      db.exec(sql)

      // 創建索引
      if (tableSchema.indexes) {
        for (const index of tableSchema.indexes) {
          const indexSQL = this.generateIndexSQL(tableName, index)
          db.exec(indexSQL)
        }
      }
    }

    console.log(`✅ 資料庫表結構已創建: ${this.dbPath}`)
    return db
  }

  /**
   * 插入資料（支持自動輪轉）
   * @param {string} tableName - 表名（可以是基礎表名）
   * @param {Object} data - 要插入的資料
   * @param {boolean} autoRotate - 是否自動輪轉（默認 true）
   */
  async insert(tableName, data, autoRotate = true) {
    // 檢查是否需要輪轉
    if (autoRotate && (await this.shouldRotateTable(tableName))) {
      await this.rotateTable(tableName)
    }

    // 獲取實際的表名（可能是輪轉後的表名）
    const actualTableName = this.getCurrentTableName(tableName)
    const db = this.getConnection()

    // 確保表存在
    await this.ensureTableExists(tableName, actualTableName)

    // 使用預編譯語句快取提高性能
    const stmtKey = `${actualTableName}_insert`

    if (!this.statements.has(stmtKey)) {
      const columns = Object.keys(data).filter((key) => data[key] !== undefined)
      const placeholders = columns.map(() => '?').join(', ')
      const sql = `INSERT INTO ${actualTableName} (${columns.join(', ')}) VALUES (${placeholders})`

      this.statements.set(stmtKey, db.prepare(sql))
    }

    const stmt = this.statements.get(stmtKey)
    const values = Object.keys(data)
      .filter((key) => data[key] !== undefined)
      .map((key) => data[key])

    const result = stmt.run(...values)
    return { ...result, tableName: actualTableName }
  }

  /**
   * 確保表存在
   * @param {string} baseTableName - 基礎表名
   * @param {string} actualTableName - 實際表名
   */
  async ensureTableExists(baseTableName, actualTableName) {
    const config = this.tableRotationConfig.get(baseTableName)
    if (!config || !config.tableSchema) {
      return // 沒有配置或沒有表結構定義
    }

    const db = this.getConnection()
    const tableExists = db
      .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`)
      .get(actualTableName)

    if (!tableExists) {
      // 創建表
      const sql = this.generateCreateTableSQL(actualTableName, config.tableSchema)
      db.exec(sql)

      // 創建索引
      if (config.tableSchema.indexes) {
        const currentIndex = this.currentTableIndexes.get(baseTableName) || 1
        for (const index of config.tableSchema.indexes) {
          const indexSQL = this.generateIndexSQL(actualTableName, {
            ...index,
            name: `${index.name}_${currentIndex.toString().padStart(3, '0')}`
          })
          db.exec(indexSQL)
        }
      }

      console.log(`✅ 已創建輪轉表: ${actualTableName}`)
    }
  }

  /**
   * 查詢資料
   * @param {string} tableName - 表名
   * @param {Object} conditions - 查詢條件
   * @param {Object} options - 查詢選項
   */
  async select(tableName, conditions = {}, options = {}) {
    const db = this.getConnection()

    let sql = `SELECT * FROM ${tableName}`
    const params = []

    // 建構 WHERE 條件
    if (Object.keys(conditions).length > 0) {
      const whereClause = Object.keys(conditions)
        .map((key) => `${key} = ?`)
        .join(' AND ')
      sql += ` WHERE ${whereClause}`
      params.push(...Object.values(conditions))
    }

    // 排序
    if (options.orderBy) {
      sql += ` ORDER BY ${options.orderBy}`
      if (options.order === 'DESC') {
        sql += ' DESC'
      }
    }

    // 限制數量
    if (options.limit) {
      sql += ` LIMIT ?`
      params.push(options.limit)
    }

    const stmt = db.prepare(sql)
    return options.single ? stmt.get(...params) : stmt.all(...params)
  }

  /**
   * 查詢輪轉表資料（跨所有相關表）
   * @param {string} baseTableName - 基礎表名
   * @param {Object} conditions - 查詢條件
   * @param {Object} options - 查詢選項
   */
  async selectFromRotatedTables(baseTableName, conditions = {}, options = {}) {
    const config = this.tableRotationConfig.get(baseTableName)
    if (!config) {
      // 沒有輪轉配置，使用原始查詢
      return this.select(baseTableName, conditions, options)
    }

    const db = this.getConnection()
    const currentIndex = this.currentTableIndexes.get(baseTableName) || 1
    let allResults = []

    // 查詢所有相關表
    for (let i = 1; i <= currentIndex; i++) {
      const tableName = `${baseTableName}_${i.toString().padStart(3, '0')}`
      const tableExists = db
        .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`)
        .get(tableName)

      if (tableExists) {
        try {
          const results = await this.select(tableName, conditions, { ...options, single: false })
          if (Array.isArray(results)) {
            allResults = allResults.concat(
              results.map((row) => ({ ...row, _sourceTable: tableName }))
            )
          }
        } catch (error) {
          console.warn(`查詢表 ${tableName} 時發生錯誤:`, error.message)
        }
      }
    }

    // 應用排序和限制
    if (options.orderBy) {
      allResults.sort((a, b) => {
        const valueA = a[options.orderBy]
        const valueB = b[options.orderBy]

        if (options.order === 'DESC') {
          return valueB > valueA ? 1 : valueB < valueA ? -1 : 0
        } else {
          return valueA > valueB ? 1 : valueA < valueB ? -1 : 0
        }
      })
    }

    if (options.limit) {
      allResults = allResults.slice(0, options.limit)
    }

    return options.single ? allResults[0] || null : allResults
  }

  /**
   * 清理舊的輪轉表
   * @param {string} baseTableName - 基礎表名
   * @param {number} keepCount - 保留的表數量（從最新開始）
   */
  async cleanupRotatedTables(baseTableName, keepCount = 3) {
    const config = this.tableRotationConfig.get(baseTableName)
    if (!config) {
      throw new Error(`表 ${baseTableName} 沒有輪轉配置`)
    }

    const db = this.getConnection()
    const currentIndex = this.currentTableIndexes.get(baseTableName) || 1
    const tablesToDelete = []

    // 找出要刪除的表
    for (let i = 1; i <= currentIndex - keepCount; i++) {
      const tableName = `${baseTableName}_${i.toString().padStart(3, '0')}`
      const tableExists = db
        .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`)
        .get(tableName)

      if (tableExists) {
        tablesToDelete.push(tableName)
      }
    }

    // 刪除舊表
    for (const tableName of tablesToDelete) {
      try {
        db.exec(`DROP TABLE ${tableName}`)
        console.log(`🗑️ 已刪除舊輪轉表: ${tableName}`)
      } catch (error) {
        console.error(`刪除表 ${tableName} 失敗:`, error.message)
      }
    }

    // 清理相關的預編譯語句快取
    for (const tableName of tablesToDelete) {
      for (const [key] of this.statements) {
        if (key.includes(tableName)) {
          this.statements.delete(key)
        }
      }
    }

    return {
      deletedTables: tablesToDelete,
      remainingTables: currentIndex - tablesToDelete.length
    }
  }

  /**
   * 獲取輪轉表的總記錄數
   * @param {string} baseTableName - 基礎表名
   */
  async getRotatedTablesRecordCount(baseTableName) {
    const config = this.tableRotationConfig.get(baseTableName)
    if (!config) {
      // 沒有輪轉配置，查詢原始表
      return this.getTableRecordCount(baseTableName)
    }

    const db = this.getConnection()
    const currentIndex = this.currentTableIndexes.get(baseTableName) || 1
    let totalCount = 0

    for (let i = 1; i <= currentIndex; i++) {
      const tableName = `${baseTableName}_${i.toString().padStart(3, '0')}`
      const tableExists = db
        .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`)
        .get(tableName)

      if (tableExists) {
        const count = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get().count
        totalCount += count
      }
    }

    return totalCount
  }

  /**
   * 獲取單個表的記錄數
   * @param {string} tableName - 表名
   */
  async getTableRecordCount(tableName) {
    const db = this.getConnection()
    try {
      const result = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get()
      return result.count
    } catch (error) {
      return 0
    }
  }

  /**
   * 更新資料
   * @param {string} tableName - 表名
   * @param {Object} data - 更新的資料
   * @param {Object} conditions - 更新條件
   */
  async update(tableName, data, conditions) {
    const db = this.getConnection()

    const setClause = Object.keys(data)
      .map((key) => `${key} = ?`)
      .join(', ')
    const whereClause = Object.keys(conditions)
      .map((key) => `${key} = ?`)
      .join(' AND ')

    const sql = `UPDATE ${tableName} SET ${setClause} WHERE ${whereClause}`
    const params = [...Object.values(data), ...Object.values(conditions)]

    const stmt = db.prepare(sql)
    return stmt.run(...params)
  }

  /**
   * 刪除資料
   * @param {string} tableName - 表名
   * @param {Object} conditions - 刪除條件
   */
  async delete(tableName, conditions) {
    const db = this.getConnection()

    const whereClause = Object.keys(conditions)
      .map((key) => `${key} = ?`)
      .join(' AND ')
    const sql = `DELETE FROM ${tableName} WHERE ${whereClause}`
    const params = Object.values(conditions)

    const stmt = db.prepare(sql)
    return stmt.run(...params)
  }

  /**
   * 執行自定義 SQL
   * @param {string} sql - SQL 語句
   * @param {Array} params - 參數
   */
  async executeSQL(sql, params = []) {
    const db = this.getConnection()
    const stmt = db.prepare(sql)
    return stmt.all(...params)
  }

  /**
   * 獲取資料庫統計資訊
   * @param {string} tableName - 表名（可選）
   */
  async getStatistics(tableName = null) {
    const db = this.getConnection()

    if (tableName) {
      // 單表統計
      const stmt = db.prepare(`
        SELECT
          COUNT(*) as record_count,
          MIN(timestamp) as earliest_timestamp,
          MAX(timestamp) as latest_timestamp
        FROM ${tableName}
      `)
      return stmt.get()
    } else {
      // 整個資料庫統計
      const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all()

      const stats = {}
      for (const table of tables) {
        const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get()
        stats[table.name] = count.count
      }

      return {
        tables: stats,
        total_tables: tables.length,
        database_size: this.getDatabaseSize()
      }
    }
  }

  /**
   * 資料庫維護 - VACUUM
   */
  async vacuum() {
    const db = this.getConnection()
    db.exec('VACUUM')
    console.log(`🧹 資料庫已整理: ${this.dbPath}`)
  }

  /**
   * 備份資料庫
   * @param {string} targetPath - 目標備份路徑
   */
  async backup(targetPath) {
    const db = this.getConnection()

    // 確保目標目錄存在
    const targetDir = path.dirname(targetPath)
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true })
    }

    db.exec(`VACUUM INTO '${targetPath}'`)
    console.log(`💾 資料庫備份完成: ${this.dbPath} -> ${targetPath}`)
  }

  /**
   * 關閉資料庫連接
   */
  close() {
    if (this.db) {
      this.db.close()
      this.isConnected = false
      this.statements.clear()
      console.log(`🔒 資料庫連接已關閉: ${this.dbPath}`)
    }
  }

  /**
   * 獲取資料庫檔案大小
   * @private
   */
  getDatabaseSize() {
    try {
      const stats = fs.statSync(this.dbPath)
      return stats.size
    } catch (error) {
      return 0
    }
  }

  /**
   * 生成建表 SQL
   * @param {string} tableName - 表名
   * @param {Object} schema - 表結構
   * @private
   */
  generateCreateTableSQL(tableName, schema) {
    const columns = []

    for (const [colName, colDef] of Object.entries(schema.columns || {})) {
      let columnSQL = `${colName} ${colDef.type}`

      if (colDef.primary) columnSQL += ' PRIMARY KEY'
      if (colDef.autoIncrement) columnSQL += ' AUTOINCREMENT'
      if (colDef.unique && !colDef.primary) columnSQL += ' UNIQUE'
      if (colDef.notNull) columnSQL += ' NOT NULL'
      if (colDef.default !== undefined) columnSQL += ` DEFAULT ${colDef.default}`

      columns.push(columnSQL)
    }

    return `CREATE TABLE IF NOT EXISTS ${tableName} (\n  ${columns.join(',\n  ')}\n)`
  }

  /**
   * 生成索引 SQL
   * @param {string} tableName - 表名
   * @param {Object} index - 索引定義
   * @private
   */
  generateIndexSQL(tableName, index) {
    const uniqueKeyword = index.unique ? 'UNIQUE ' : ''
    return `CREATE ${uniqueKeyword}INDEX IF NOT EXISTS ${index.name} ON ${tableName}(${index.columns.join(', ')})`
  }

  /**
   * 設置表輪轉配置
   * @param {string} baseTableName - 基礎表名
   * @param {number} maxRecords - 每個表的最大記錄數
   * @param {Object} tableSchema - 表結構定義
   */
  setTableRotationConfig(baseTableName, maxRecords, tableSchema = null) {
    this.tableRotationConfig.set(baseTableName, {
      maxRecords,
      tableSchema,
      enabled: true
    })

    // 初始化當前表索引
    if (!this.currentTableIndexes.has(baseTableName)) {
      this.currentTableIndexes.set(baseTableName, 1)
    }

    console.log(`📊 已設置表輪轉配置: ${baseTableName} (最大記錄數: ${maxRecords})`)
  }

  /**
   * 停用表輪轉
   * @param {string} baseTableName - 基礎表名
   */
  disableTableRotation(baseTableName) {
    if (this.tableRotationConfig.has(baseTableName)) {
      const config = this.tableRotationConfig.get(baseTableName)
      config.enabled = false
      console.log(`🚫 已停用表輪轉: ${baseTableName}`)
    }
  }

  /**
   * 獲取當前活躍的表名
   * @param {string} baseTableName - 基礎表名
   * @returns {string} 當前表名
   */
  getCurrentTableName(baseTableName) {
    if (!this.tableRotationConfig.has(baseTableName)) {
      return baseTableName // 沒有配置輪轉，使用原始表名
    }

    const currentIndex = this.currentTableIndexes.get(baseTableName) || 1
    return `${baseTableName}_${currentIndex.toString().padStart(3, '0')}`
  }

  /**
   * 檢查是否需要輪轉表
   * @param {string} baseTableName - 基礎表名
   * @returns {Promise<boolean>} 是否需要輪轉
   */
  async shouldRotateTable(baseTableName) {
    const config = this.tableRotationConfig.get(baseTableName)
    if (!config || !config.enabled) {
      return false
    }

    const currentTableName = this.getCurrentTableName(baseTableName)

    // 檢查表是否存在
    const db = this.getConnection()
    const tableExists = db
      .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`)
      .get(currentTableName)

    if (!tableExists) {
      return false // 表不存在，不需要輪轉
    }

    // 檢查記錄數量
    const recordCount = db.prepare(`SELECT COUNT(*) as count FROM ${currentTableName}`).get().count

    return recordCount >= config.maxRecords
  }

  /**
   * 執行表輪轉
   * @param {string} baseTableName - 基礎表名
   * @returns {Promise<string>} 新表名
   */
  async rotateTable(baseTableName) {
    const config = this.tableRotationConfig.get(baseTableName)
    if (!config || !config.enabled) {
      throw new Error(`表 ${baseTableName} 沒有啟用輪轉功能`)
    }

    // 增加表索引
    const currentIndex = this.currentTableIndexes.get(baseTableName) || 1
    const newIndex = currentIndex + 1
    this.currentTableIndexes.set(baseTableName, newIndex)

    const newTableName = this.getCurrentTableName(baseTableName)

    // 創建新表
    if (config.tableSchema) {
      const sql = this.generateCreateTableSQL(newTableName, config.tableSchema)
      const db = this.getConnection()
      db.exec(sql)

      // 創建索引
      if (config.tableSchema.indexes) {
        for (const index of config.tableSchema.indexes) {
          const indexSQL = this.generateIndexSQL(newTableName, {
            ...index,
            name: `${index.name}_${newIndex.toString().padStart(3, '0')}`
          })
          db.exec(indexSQL)
        }
      }
    }

    // 清理相關的預編譯語句快取
    for (const [key] of this.statements) {
      if (key.includes(baseTableName)) {
        this.statements.delete(key)
      }
    }

    console.log(`🔄 表已輪轉: ${baseTableName} -> ${newTableName}`)
    return newTableName
  }

  /**
   * 獲取表輪轉統計資訊
   * @param {string} baseTableName - 基礎表名
   * @returns {Promise<Object>} 輪轉統計資訊
   */
  async getTableRotationStats(baseTableName) {
    const config = this.tableRotationConfig.get(baseTableName)
    if (!config) {
      return { enabled: false }
    }

    const db = this.getConnection()
    const currentIndex = this.currentTableIndexes.get(baseTableName) || 1
    const tables = []

    // 查找所有相關表
    for (let i = 1; i <= currentIndex; i++) {
      const tableName = `${baseTableName}_${i.toString().padStart(3, '0')}`
      const tableExists = db
        .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`)
        .get(tableName)

      if (tableExists) {
        const recordCount = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get().count

        tables.push({
          name: tableName,
          index: i,
          recordCount,
          isCurrent: i === currentIndex
        })
      }
    }

    return {
      enabled: config.enabled,
      maxRecords: config.maxRecords,
      currentIndex,
      totalTables: tables.length,
      totalRecords: tables.reduce((sum, table) => sum + table.recordCount, 0),
      tables
    }
  }

  /**
   * 析構函數 - 清理資源
   */
  destroy() {
    this.close()
  }

  /**
   * 獲取並印出指定表的 Schema
   * @param {string} tableName - 表名
   */
  async printTableSchema(tableName) {
    try {
      const db = this.getConnection()

      // 檢查表是否存在
      const tableExists = db
        .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`)
        .get(tableName)

      if (!tableExists) {
        console.log(`❌ 表 '${tableName}' 不存在`)
        return null
      }

      console.log(`📊 Table Schema: ${tableName}`)
      console.log('='.repeat(50))

      // 獲取表結構
      const columns = db.prepare(`PRAGMA table_info(${tableName})`).all()

      columns.forEach((col) => {
        const nullable = col.notnull ? 'NOT NULL' : 'NULL'
        const primaryKey = col.pk ? ' (PRIMARY KEY)' : ''
        const defaultValue = col.dflt_value ? ` DEFAULT ${col.dflt_value}` : ''

        console.log(`  ${col.name}: ${col.type} ${nullable}${defaultValue}${primaryKey}`)
      })

      // 獲取索引資訊
      const indexes = db.prepare(`PRAGMA index_list(${tableName})`).all()
      if (indexes.length > 0) {
        console.log('\n📋 Indexes:')
        indexes.forEach((index) => {
          const indexInfo = db.prepare(`PRAGMA index_info(${index.name})`).all()
          const columns = indexInfo.map((info) => info.name).join(', ')
          const unique = index.unique ? 'UNIQUE ' : ''
          console.log(`  ${unique}${index.name}: (${columns})`)
        })
      }

      console.log('='.repeat(50))
      return columns
    } catch (error) {
      console.error(`❌ 獲取表 ${tableName} Schema 失敗:`, error)
      throw error
    }
  }
}
