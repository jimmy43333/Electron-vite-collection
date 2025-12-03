// filepath: /home/tgsung/Desktop/Electron-vite-collection/resources/model/sessionTypes.js
// 會話相關的類型定義和工具函數

/**
 * 會話狀態枚舉
 */
export const SESSION_STATUS = {
  CREATED: 'created', // 已創建，尚未開始
  ACTIVE: 'active', // 活躍中（正在接收資料）
  PAUSED: 'paused', // 暫停
  COMPLETED: 'completed', // 已完成
  FAILED: 'failed', // 失敗
  ARCHIVED: 'archived' // 已歸檔
}

/**
 * 會話結果類型枚舉
 */
export const SESSION_RESULT = {
  SUCCESS: 'success', // 成功
  TIMEOUT: 'timeout', // 超時
  ERROR: 'error', // 錯誤
  USER_STOPPED: 'user_stopped', // 用戶停止
  SYSTEM_LIMIT: 'system_limit', // 系統限制（如達到最大記錄數）
  ROTATION: 'rotation' // 因輪轉而結束
}

/**
 * 輪轉策略枚舉
 */
export const ROTATION_POLICY = {
  TIME_BASED: 'time_based', // 基於時間輪轉
  SIZE_BASED: 'size_based', // 基於大小輪轉
  COUNT_BASED: 'count_based', // 基於記錄數輪轉
  MANUAL: 'manual', // 手動輪轉
  DISABLED: 'disabled' // 禁用輪轉
}

/**
 * 資料庫類型枚舉
 */
export const DB_TYPE = {
  META: 'meta', // Meta 資料庫（存儲會話元資料）
  SESSION: 'session' // Session 資料庫（存儲實際測試資料）
}

/**
 * 會話事件類型
 */
export const SESSION_EVENTS = {
  CREATED: 'session:created',
  STARTED: 'session:started',
  PAUSED: 'session:paused',
  RESUMED: 'session:resumed',
  COMPLETED: 'session:completed',
  FAILED: 'session:failed',
  DATA_RECEIVED: 'session:data_received',
  ROTATION_TRIGGERED: 'session:rotation_triggered',
  ROTATION_COMPLETED: 'session:rotation_completed',
  CLEANUP_STARTED: 'session:cleanup_started',
  CLEANUP_COMPLETED: 'session:cleanup_completed'
}

/**
 * 預設輪轉設定
 */
export const DEFAULT_ROTATION_CONFIG = {
  policy: ROTATION_POLICY.COUNT_BASED,
  maxRecords: 10000, // 最大記錄數
  maxSize: 100 * 1024 * 1024, // 100MB
  maxDuration: 60 * 60 * 1000, // 1小時
  enabled: true
}

/**
 * 預設會話設定
 */
export const DEFAULT_SESSION_CONFIG = {
  autoStart: true,
  enableCleanup: true,
  maxRetries: 3,
  timeout: 30 * 60 * 1000, // 30分鐘
  compressionEnabled: false,
  backupEnabled: true
}

/**
 * 會話元資料結構
 */
export class SessionMetadata {
  constructor(options = {}) {
    this.sessionId = options.sessionId || generateSessionId()
    this.testName = options.testName || 'Unnamed Test'
    this.description = options.description || ''
    this.status = options.status || SESSION_STATUS.CREATED
    this.result = options.result || null
    this.startTime = options.startTime || null
    this.endTime = options.endTime || null
    this.duration = options.duration || null
    this.recordCount = options.recordCount || 0
    this.dataSize = options.dataSize || 0
    this.rotationPolicy = options.rotationPolicy || DEFAULT_ROTATION_CONFIG
    this.config = { ...DEFAULT_SESSION_CONFIG, ...options.config }
    this.tags = options.tags || []
    this.metadata = options.metadata || {}
    this.createdAt = options.createdAt || new Date().toISOString()
    this.updatedAt = options.updatedAt || new Date().toISOString()
  }

  /**
   * 更新會話狀態
   * @param {string} status - 新狀態
   * @param {Object} additionalData - 額外資料
   */
  updateStatus(status, additionalData = {}) {
    this.status = status
    this.updatedAt = new Date().toISOString()

    // 根據狀態設定相關時間
    if (status === SESSION_STATUS.ACTIVE && !this.startTime) {
      this.startTime = this.updatedAt
    } else if ([SESSION_STATUS.COMPLETED, SESSION_STATUS.FAILED].includes(status)) {
      this.endTime = this.updatedAt
      if (this.startTime) {
        this.duration = new Date(this.endTime) - new Date(this.startTime)
      }
    }

    // 合併額外資料
    Object.assign(this, additionalData)
  }

  /**
   * 轉換為 JSON 物件
   * @returns {Object} JSON 物件
   */
  toJSON() {
    return {
      sessionId: this.sessionId,
      testName: this.testName,
      description: this.description,
      status: this.status,
      result: this.result,
      startTime: this.startTime,
      endTime: this.endTime,
      duration: this.duration,
      recordCount: this.recordCount,
      dataSize: this.dataSize,
      rotationPolicy: this.rotationPolicy,
      config: this.config,
      tags: this.tags,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }

  /**
   * 從 JSON 物件創建實例
   * @param {Object} json - JSON 物件
   * @returns {SessionMetadata} 會話元資料實例
   */
  static fromJSON(json) {
    return new SessionMetadata(json)
  }
}

/**
 * 輪轉策略配置類別
 */
export class RotationConfig {
  constructor(options = {}) {
    this.policy = options.policy || ROTATION_POLICY.COUNT_BASED
    this.maxRecords = options.maxRecords || DEFAULT_ROTATION_CONFIG.maxRecords
    this.maxSize = options.maxSize || DEFAULT_ROTATION_CONFIG.maxSize
    this.maxDuration = options.maxDuration || DEFAULT_ROTATION_CONFIG.maxDuration
    this.enabled = options.enabled !== undefined ? options.enabled : DEFAULT_ROTATION_CONFIG.enabled
    this.customCondition = options.customCondition || null // 自定義條件函數
  }

  /**
   * 檢查是否應該觸發輪轉
   * @param {Object} sessionStats - 會話統計資料
   * @returns {boolean} 是否應該輪轉
   */
  shouldRotate(sessionStats) {
    if (!this.enabled) {
      return false
    }

    switch (this.policy) {
      case ROTATION_POLICY.COUNT_BASED:
        return sessionStats.recordCount >= this.maxRecords

      case ROTATION_POLICY.SIZE_BASED:
        return sessionStats.dataSize >= this.maxSize

      case ROTATION_POLICY.TIME_BASED:
        return sessionStats.duration >= this.maxDuration

      case ROTATION_POLICY.MANUAL:
        return false // 手動模式不自動觸發

      case ROTATION_POLICY.DISABLED:
        return false

      default:
        // 自定義條件
        if (this.customCondition && typeof this.customCondition === 'function') {
          return this.customCondition(sessionStats)
        }
        return false
    }
  }

  /**
   * 獲取輪轉原因
   * @param {Object} sessionStats - 會話統計資料
   * @returns {string} 輪轉原因
   */
  getRotationReason(sessionStats) {
    if (!this.shouldRotate(sessionStats)) {
      return null
    }

    switch (this.policy) {
      case ROTATION_POLICY.COUNT_BASED:
        return `記錄數達到上限 (${sessionStats.recordCount}/${this.maxRecords})`
      case ROTATION_POLICY.SIZE_BASED:
        return `資料庫大小達到上限 (${this.formatSize(sessionStats.dataSize)}/${this.formatSize(this.maxSize)})`
      case ROTATION_POLICY.TIME_BASED:
        return `時間達到上限 (${this.formatDuration(sessionStats.duration)}/${this.formatDuration(this.maxDuration)})`
      default:
        return '自定義條件觸發'
    }
  }

  /**
   * 格式化檔案大小
   * @param {number} size - 位元組大小
   * @returns {string} 格式化後的大小
   * @private
   */
  formatSize(size) {
    const units = ['B', 'KB', 'MB', 'GB']
    let index = 0
    let value = size

    while (value >= 1024 && index < units.length - 1) {
      value /= 1024
      index++
    }

    return `${Math.round(value * 100) / 100} ${units[index]}`
  }

  /**
   * 格式化持續時間
   * @param {number} duration - 毫秒
   * @returns {string} 格式化後的時間
   * @private
   */
  formatDuration(duration) {
    const seconds = Math.floor(duration / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }
}

/**
 * 工具函數：生成唯一的會話 ID
 * @returns {string} 會話 ID
 */
export function generateSessionId() {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `session_${timestamp}_${random}`
}

/**
 * 工具函數：驗證會話 ID 格式
 * @param {string} sessionId - 會話 ID
 * @returns {boolean} 是否有效
 */
export function validateSessionId(sessionId) {
  if (!sessionId || typeof sessionId !== 'string') {
    return false
  }

  // 檢查格式：session_timestamp_random
  const pattern = /^session_\d+_[a-z0-9]{6}$/
  return pattern.test(sessionId)
}

/**
 * 工具函數：生成資料庫檔案路徑
 * @param {string} baseDir - 基礎目錄
 * @param {string} sessionId - 會話 ID
 * @param {string} dbType - 資料庫類型
 * @returns {string} 資料庫檔案路徑
 */
export function generateDbPath(baseDir, sessionId, dbType = DB_TYPE.SESSION) {
  const sanitizedSessionId = sessionId.replace(/[^a-zA-Z0-9_-]/g, '_')
  const filename = dbType === DB_TYPE.META ? 'meta.db' : `${sanitizedSessionId}.db`
  return `${baseDir}/${filename}`
}

/**
 * 工具函數：解析資料庫檔案名取得會話 ID
 * @param {string} filename - 檔案名
 * @returns {string|null} 會話 ID 或 null
 */
export function parseSessionIdFromFilename(filename) {
  const match = filename.match(/^(session_\d+_[a-z0-9]{6})\.db$/)
  return match ? match[1] : null
}

/**
 * 工具函數：格式化會話摘要
 * @param {SessionMetadata} metadata - 會話元資料
 * @returns {string} 格式化的摘要
 */
export function formatSessionSummary(metadata) {
  const duration = metadata.duration
    ? new RotationConfig().formatDuration(metadata.duration)
    : 'N/A'

  return [
    `會話: ${metadata.sessionId}`,
    `測試: ${metadata.testName}`,
    `狀態: ${metadata.status}`,
    `記錄數: ${metadata.recordCount.toLocaleString()}`,
    `持續時間: ${duration}`,
    `創建時間: ${new Date(metadata.createdAt).toLocaleString()}`
  ].join('\n')
}
