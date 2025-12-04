import WebSocket from 'ws'

export class WebSocketClient {
  constructor(dataKey = 'defaultData', DataManager = null) {
    this.clientKey = dataKey
    this.reconnectInterval = 5000
    this.maxReconnectAttempts = Infinity
    this.pingIntervalTime = 30000 // ping 間隔時間
    this.connection = null
    this.reconnectAttempts = 0
    this.pingIntervalId = null // ping 定時器 ID
    this.reconnectTimeoutId = null // 重連定時器 ID

    this.dataManager = DataManager
  }

  // ======================
  // 公開 API (Public APIs)
  // ======================

  /**
   * 建立 WebSocket 連接
   * @param {string} url - WebSocket 伺服器 URL
   */
  connect(url) {
    if (this.connection) {
      console.log(`Connection ${this.clientKey} already exists`)
      return
    }

    if (!url) {
      url = this.url
    } else {
      this.url = url
    }

    const ws = new WebSocket(url)

    ws.on('open', () => {
      console.log(`✓ WebSocket ${this.clientKey} connected`)
      this.reconnectAttempts = 0

      // 開始 ping 檢測
      this.startPing()
    })

    ws.on('message', (data) => {
      this.handleMessage(data)
    })

    ws.on('error', (error) => {
      this.handleError(error)
    })

    ws.on('close', (code) => {
      this.handleClose(code)
    })

    ws.on('pong', () => {
      // 收到 pong 響應，連接正常
      ws.isAlive = true
    })

    this.connection = ws
  }

  /**
   * 關閉連接
   */
  disconnect() {
    this.reconnectAttempts = Infinity
    this.clearReconnectTimeout() // 清除重連定時器
    if (this.connection) {
      this.clearPing()
      this.connection.close()
      this.connection = null
      console.log(`Connection ${this.clientKey} closed manually`)
    }
  }

  /**
   * 獲取連接狀態
   * @returns {string} 連接狀態
   */
  getConnectionStatus() {
    if (!this.connection) return 'disconnected'

    switch (this.connection.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting'
      case WebSocket.OPEN:
        return 'connected'
      case WebSocket.CLOSING:
        return 'closing'
      case WebSocket.CLOSED:
        return 'disconnected'
      default:
        return 'unknown'
    }
  }

  // =========================
  // 私有函數 (Private Methods)
  // =========================

  /**
   * 處理接收到的訊息
   * @private
   */
  async handleMessage(data) {
    try {
      if (this.dataManager) {
        if (typeof this.dataManager.updateWebsocketData === 'function') {
          await this.dataManager.updateWebsocketData(data)
        } else {
          console.warn(`DataManager ${this.clientKey} does not have updateData method`)
        }
      }
    } catch (error) {
      console.error(`Error parsing message from ${this.clientKey}:`, error)
    }
  }

  /**
   * 處理連接錯誤
   * @private
   */
  handleError(error) {
    console.error(`WebSocket ${this.clientKey} error:`, error.message)
  }

  /**
   * 處理連接關閉
   * @private
   */
  handleClose(code) {
    console.log(`WebSocket ${this.clientKey} closed (code: ${code})`)
    this.clearPing()
    this.connection = null

    // 自動重連
    this.handleReconnect()
  }

  /**
   * 處理重連邏輯
   * @private
   */
  handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`Max reconnect attempts reached for ${this.clientKey}`)
      return
    }

    this.reconnectAttempts++

    const delay = Math.min(
      this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1),
      30000 // 最大延遲 30 秒
    )

    console.log(
      `Reconnecting ${this.clientKey} in ${delay}ms (attempt ${this.reconnectAttempts})...`
    )

    this.reconnectTimeoutId = setTimeout(() => {
      this.reconnectTimeoutId = null
      this.connect()
    }, delay)
  }

  /**
   * 清除 ping 定時器
   * @private
   */
  clearPing() {
    if (this.pingIntervalId) {
      clearInterval(this.pingIntervalId)
      this.pingIntervalId = null
    }
  }

  /**
   * 清除重連定時器
   * @private
   */
  clearReconnectTimeout() {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId)
      this.reconnectTimeoutId = null
    }
  }

  /**
   * 開始 ping 檢測
   * @private
   */
  startPing() {
    if (!this.connection) return

    this.pingIntervalId = setInterval(() => {
      if (this.connection.readyState === WebSocket.OPEN) {
        this.connection.isAlive = false
        this.connection.ping()

        // 如果在指定時間內沒有收到 pong，則關閉連接
        setTimeout(() => {
          if (!this.connection.isAlive) {
            console.log(`No pong received from ${this.clientKey}, terminating connection`)
            this.connection.terminate()
          }
        }, 10000) // 10秒超時
      }
    }, this.pingIntervalTime)
  }
}
