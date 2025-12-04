// filepath: /home/tgsung/Desktop/Electron-vite-collection/resources/model/dbSchemas.js
// 資料庫結構定義和 SQL 生成工具

/**
 * Meta 資料庫結構 - 存儲會話元資料
 */
export const META_DB_SCHEMA = {
  sessions: {
    columns: {
      sessionId: {
        type: 'TEXT',
        primary: true,
        notNull: true
      },
      testName: {
        type: 'TEXT',
        notNull: true
      },
      workspace: {
        type: 'TEXT',
        notNull: true
      },
      description: {
        type: 'TEXT',
        default: "''"
      },
      status: {
        type: 'TEXT',
        notNull: true,
        default: "'created'"
      },
      testStartTime: {
        type: 'TEXT'
      },
      testEndTime: {
        type: 'TEXT'
      },
      recordCount: {
        type: 'INTEGER',
        default: 0
      },
      dataSize: {
        type: 'INTEGER',
        default: 0
      },
      rotationPolicy: {
        type: 'TEXT'
      },
      dbPath: {
        type: 'TEXT'
      },
      createdAt: {
        type: 'TEXT',
        notNull: true
      },
      updatedAt: {
        type: 'TEXT',
        notNull: true
      },
      summary: {
        type: 'TEXT'
      }
    },
    indexes: [
      {
        name: 'idx_sessions_status',
        columns: ['status'],
        unique: false
      },
      {
        name: 'idx_sessions_created_at',
        columns: ['createdAt'],
        unique: false
      },
      {
        name: 'idx_sessions_test_name',
        columns: ['testName'],
        unique: false
      }
    ]
  },

  rotationHistory: {
    columns: {
      id: {
        type: 'INTEGER',
        primary: true,
        autoIncrement: true
      },
      sessionId: {
        type: 'TEXT',
        notNull: true
      },
      rotationTime: {
        type: 'TEXT',
        notNull: true
      },
      reason: {
        type: 'TEXT',
        notNull: true
      },
      oldDbPath: {
        type: 'TEXT',
        notNull: true
      },
      newDbPath: {
        type: 'TEXT',
        notNull: true
      },
      recordsTransferred: {
        type: 'INTEGER',
        default: 0
      },
      dataSize: {
        type: 'INTEGER',
        default: 0
      }
    },
    indexes: [
      {
        name: 'idx_rotation_session_id',
        columns: ['sessionId'],
        unique: false
      },
      {
        name: 'idx_rotation_time',
        columns: ['rotationTime'],
        unique: false
      }
    ]
  }
}

/**
 * Session 資料庫結構 - 存儲實際測試資料
 */
export const SESSION_DB_SCHEMA = {
  // 會話基本資訊（冗餘設計，保證會話一致性）
  sessionInfo: {
    columns: {
      sessionId: {
        type: 'TEXT',
        primary: true,
        notNull: true
      },
      testName: {
        type: 'TEXT',
        notNull: true
      },
      workspace: {
        type: 'TEXT',
        notNull: true
      },
      description: {
        type: 'TEXT',
        default: "''"
      },
      status: {
        type: 'TEXT',
        notNull: true,
        default: "'created'"
      },
      testStartTime: {
        type: 'TEXT'
      },
      testEndTime: {
        type: 'TEXT'
      },
      recordCount: {
        type: 'INTEGER',
        default: 0
      },
      dataSize: {
        type: 'INTEGER',
        default: 0
      },
      rotationPolicy: {
        type: 'TEXT'
      },
      dbPath: {
        type: 'TEXT'
      },
      createdAt: {
        type: 'TEXT',
        notNull: true
      },
      updatedAt: {
        type: 'TEXT',
        notNull: true
      },
      summary: {
        type: 'TEXT'
      }
    }
  },

  // WebSocket 資料表
  websocketData: {
    columns: {
      id: {
        type: 'INTEGER',
        primary: true,
        autoIncrement: true
      },
      sessionId: {
        type: 'TEXT',
        notNull: true
      },
      timestamp: {
        type: 'INTEGER',
        notNull: true
      },
      data: {
        type: 'TEXT',
        notNull: true
      },
      size: {
        type: 'INTEGER',
        notNull: true
      }
    },
    indexes: [
      {
        name: 'idx_websocket_session_id',
        columns: ['sessionId'],
        unique: false
      },
      {
        name: 'idx_websocket_timestamp',
        columns: ['timestamp'],
        unique: false
      }
    ]
  }
}

/**
 * 常見的 SQL 查詢模板
 */
export const SQL_QUERIES = {
  // Meta 資料庫查詢
  META: {
    // 會話管理
    CREATE_SESSION: `
      INSERT INTO sessions (
        sessionId, testName, workspace, description, status,
        testStartTime, testEndTime, recordCount, dataSize,
        rotationPolicy, dbPath, createdAt, updatedAt, summary
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,

    UPDATE_SESSION_STATUS: `
      UPDATE sessions
      SET status = ?, updatedAt = ?
      WHERE sessionId = ?
    `,

    UPDATE_SESSION_STATS: `
      UPDATE sessions
      SET recordCount = ?, dataSize = ?, updatedAt = ?
      WHERE sessionId = ?
    `,

    GET_SESSION: `
      SELECT * FROM sessions WHERE sessionId = ?
    `,

    GET_ACTIVE_SESSIONS: `
      SELECT * FROM sessions
      WHERE status IN ('active', 'paused')
      ORDER BY createdAt DESC
    `,

    GET_SESSION_HISTORY: `
      SELECT * FROM sessions
      WHERE testName = ?
      ORDER BY createdAt DESC
      LIMIT ?
    `,

    // 輪轉歷史
    RECORD_ROTATION: `
      INSERT INTO rotationHistory (
        sessionId, rotationTime, reason, oldDbPath, newDbPath,
        recordsTransferred, dataSize
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,

    GET_ROTATION_HISTORY: `
      SELECT * FROM rotationHistory
      WHERE sessionId = ?
      ORDER BY rotationTime DESC
    `
  },

  // Session 資料庫查詢
  SESSION: {
    // 會話資訊
    INIT_SESSION_INFO: `
      INSERT OR REPLACE INTO sessionInfo (
        sessionId, testName, workspace, description, status,
        testStartTime, testEndTime, recordCount, dataSize,
        rotationPolicy, dbPath, createdAt, updatedAt, summary
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,

    GET_SESSION_INFO: `
      SELECT * FROM sessionInfo WHERE sessionId = ?
    `,

    // WebSocket 資料
    INSERT_WEBSOCKET_DATA: `
      INSERT INTO websocketData (
        sessionId, timestamp, data, size
      ) VALUES (?, ?, ?, ?)
    `,

    GET_WEBSOCKET_DATA: `
      SELECT * FROM websocketData
      WHERE sessionId = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `,

    GET_WEBSOCKET_COUNT: `
      SELECT COUNT(*) as count FROM websocketData WHERE sessionId = ?
    `,

    GET_WEBSOCKET_SIZE: `
      SELECT COALESCE(SUM(size), 0) as totalSize FROM websocketData WHERE sessionId = ?
    `,

    GET_LATEST_WEBSOCKET: `
      SELECT * FROM websocketData
      WHERE sessionId = ?
      ORDER BY timestamp DESC
      LIMIT 1
    `,

    // 統計查詢
    GET_SESSION_STATS: `
      SELECT
        COUNT(w.id) as recordCount,
        COALESCE(SUM(w.size), 0) as dataSize,
        MIN(w.timestamp) as earliestTime,
        MAX(w.timestamp) as latestTime
      FROM websocketData w
      WHERE w.sessionId = ?
    `
  }
}

/**
 * SQL 工具類別
 */
export class SQLGenerator {
  /**
   * 生成批量插入 SQL
   * @param {string} tableName - 表名
   * @param {Array} columns - 列名陣列
   * @param {number} batchSize - 批次大小
   * @returns {string} 批量插入 SQL
   */
  static generateBatchInsertSQL(tableName, columns, batchSize) {
    const placeholderRow = `(${columns.map(() => '?').join(', ')})`
    const placeholders = Array(batchSize).fill(placeholderRow).join(', ')

    return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES ${placeholders}`
  }

  /**
   * 生成條件查詢 SQL
   * @param {string} tableName - 表名
   * @param {Object} conditions - 查詢條件
   * @param {Object} options - 查詢選項
   * @returns {Object} 包含 SQL 和參數的物件
   */
  static generateSelectSQL(tableName, conditions = {}, options = {}) {
    let sql = `SELECT * FROM ${tableName}`
    const params = []

    // WHERE 條件
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

    // 限制
    if (options.limit) {
      sql += ` LIMIT ?`
      params.push(options.limit)
    }

    // 偏移
    if (options.offset) {
      sql += ` OFFSET ?`
      params.push(options.offset)
    }

    return { sql, params }
  }

  /**
   * 生成更新 SQL
   * @param {string} tableName - 表名
   * @param {Object} data - 更新資料
   * @param {Object} conditions - 更新條件
   * @returns {Object} 包含 SQL 和參數的物件
   */
  static generateUpdateSQL(tableName, data, conditions) {
    const setClause = Object.keys(data)
      .map((key) => `${key} = ?`)
      .join(', ')
    const whereClause = Object.keys(conditions)
      .map((key) => `${key} = ?`)
      .join(' AND ')

    const sql = `UPDATE ${tableName} SET ${setClause} WHERE ${whereClause}`
    const params = [...Object.values(data), ...Object.values(conditions)]

    return { sql, params }
  }

  /**
   * 生成刪除 SQL
   * @param {string} tableName - 表名
   * @param {Object} conditions - 刪除條件
   * @returns {Object} 包含 SQL 和參數的物件
   */
  static generateDeleteSQL(tableName, conditions) {
    const whereClause = Object.keys(conditions)
      .map((key) => `${key} = ?`)
      .join(' AND ')

    const sql = `DELETE FROM ${tableName} WHERE ${whereClause}`
    const params = Object.values(conditions)

    return { sql, params }
  }
}

/**
 * 資料庫結構驗證工具
 */
export class SchemaValidator {
  /**
   * 驗證資料庫結構
   * @param {Object} schema - 資料庫結構
   * @returns {Array} 驗證錯誤陣列
   */
  static validateSchema(schema) {
    const errors = []

    for (const [tableName, tableSchema] of Object.entries(schema)) {
      // 檢查表結構
      if (!tableSchema.columns) {
        errors.push(`表 ${tableName} 缺少 columns 定義`)
        continue
      }

      // 檢查是否有主鍵
      const hasPrimaryKey = Object.values(tableSchema.columns).some((col) => col.primary)
      if (!hasPrimaryKey) {
        errors.push(`表 ${tableName} 缺少主鍵定義`)
      }

      // 檢查列定義
      for (const [colName, colDef] of Object.entries(tableSchema.columns)) {
        if (!colDef.type) {
          errors.push(`表 ${tableName} 的列 ${colName} 缺少類型定義`)
        }

        // 檢查自動遞增列必須是主鍵
        if (colDef.autoIncrement && !colDef.primary) {
          errors.push(`表 ${tableName} 的列 ${colName} 設定為自動遞增但不是主鍵`)
        }
      }

      // 檢查索引定義
      if (tableSchema.indexes) {
        for (const index of tableSchema.indexes) {
          if (!index.name) {
            errors.push(`表 ${tableName} 的索引缺少名稱`)
          }
          if (!index.columns || index.columns.length === 0) {
            errors.push(`表 ${tableName} 的索引 ${index.name} 缺少列定義`)
          }
        }
      }
    }

    return errors
  }

  /**
   * 檢查資料庫結構完整性
   * @param {Object} schema - 資料庫結構
   * @returns {boolean} 是否有效
   */
  static isValidSchema(schema) {
    return this.validateSchema(schema).length === 0
  }
}

/**
 * 預設匯出所有結構定義
 */
export default {
  META_DB_SCHEMA,
  SESSION_DB_SCHEMA,
  SQL_QUERIES,
  SQLGenerator,
  SchemaValidator
}
