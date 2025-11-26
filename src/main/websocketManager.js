// websocketManager.js
import WebSocket from 'ws'
import { EventEmitter } from 'events'

class WebSocketManager extends EventEmitter {
  constructor(config = {}) {
    super()

    this.config = {
      reconnectInterval: config.reconnectInterval || 5000,
      maxReconnectAttempts: config.maxReconnectAttempts || Infinity,
      pingInterval: config.pingInterval || 30000,
      ...config
    }

    this.connections = new Map()
    this.reconnectAttempts = new Map()
    this.pingIntervals = new Map()
  }

  /**
   * 初始化 WebSocket 連接
   * @param {Array} wsConfigs - WebSocket 配置數組
   * [{url: 'ws://...', dataKey: 'data1'}, ...]
   */
  initConnections(wsConfigs) {
    wsConfigs.forEach(({ url, dataKey }) => {
      this.createConnection(url, dataKey)
    })
  }

  /**
   * 創建單個 WebSocket 連接
   */
  createConnection(url, dataKey) {
    if (this.connections.has(dataKey)) {
      console.log(`Connection ${dataKey} already exists`)
      return
    }

    console.log(`Creating WebSocket connection for ${dataKey}...`)

    const ws = new WebSocket(url)

    ws.on('open', () => {
      console.log(`✓ WebSocket ${dataKey} connected`)
      this.reconnectAttempts.set(dataKey, 0)
      this.emit('connected', { dataKey })

      // 訂閱數據流
      this.subscribe(ws, dataKey)

      // 設置心跳
      this.setupPing(ws, dataKey)
    })

    ws.on('message', (data) => {
      try {
        const jsonData = JSON.parse(data.toString())
        console.log(data)
        // 處理不同類型的消息
        if (jsonData.type === 'connected') {
          console.log(`Server assigned client ID: ${jsonData.clientId}`)
          this.emit('server-connected', { dataKey, clientId: jsonData.clientId })
        } else if (jsonData.type === 'subscribed') {
          console.log(`Subscribed to ${jsonData.dataKey}`)
        } else if (jsonData.type === 'initial_data') {
          console.log(`Received initial data for ${jsonData.dataKey}: ${jsonData.count} items`)
          this.emit('message', {
            dataKey: jsonData.dataKey,
            data: { type: 'full', data: jsonData.data }
          })
        } else if (jsonData.type === 'update') {
          this.emit('message', {
            dataKey: jsonData.dataKey,
            data: { type: 'update', updates: jsonData.updates }
          })
        } else {
          this.emit('message', { dataKey, data: jsonData })
        }
      } catch (error) {
        console.error(`Error parsing message from ${dataKey}:`, error)
        this.emit('error', { dataKey, error: 'Parse error', details: error })
      }
    })

    ws.on('error', (error) => {
      console.error(`WebSocket ${dataKey} error:`, error.message)
      this.emit('error', { dataKey, error: error.message })
    })

    ws.on('close', (code, reason) => {
      console.log(`WebSocket ${dataKey} closed (code: ${code})`)
      this.clearPing(dataKey)
      this.connections.delete(dataKey)
      this.emit('closed', { dataKey, code, reason: reason.toString() })

      // 自動重連
      this.handleReconnect(url, dataKey)
    })

    ws.on('pong', () => {
      // 收到 pong 響應，連接正常
      ws.isAlive = true
    })

    this.connections.set(dataKey, ws)
  }

  /**
   * 訂閱數據流
   */
  subscribe(ws, dataKey) {
    if (ws.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({
        type: 'subscribe',
        dataKey: dataKey
      })
      ws.send(message)
      console.log(`Sent subscribe request for ${dataKey}`)
    }
  }

  /**
   * 取消訂閱數據流
   */
  unsubscribe(dataKey) {
    const ws = this.connections.get(dataKey)
    if (ws && ws.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({
        type: 'unsubscribe',
        dataKey: dataKey
      })
      ws.send(message)
      console.log(`Sent unsubscribe request for ${dataKey}`)
    }
  }

  /**
   * 設置心跳檢測
   */
  setupPing(ws, dataKey) {
    ws.isAlive = true

    const interval = setInterval(() => {
      if (ws.isAlive === false) {
        console.log(`WebSocket ${dataKey} seems dead, terminating...`)
        ws.terminate()
        return
      }

      ws.isAlive = false
      ws.ping()
    }, this.config.pingInterval)

    this.pingIntervals.set(dataKey, interval)
  }

  /**
   * 清除心跳檢測
   */
  clearPing(dataKey) {
    const interval = this.pingIntervals.get(dataKey)
    if (interval) {
      clearInterval(interval)
      this.pingIntervals.delete(dataKey)
    }
  }

  /**
   * 處理重連邏輯
   */
  handleReconnect(url, dataKey) {
    const attempts = this.reconnectAttempts.get(dataKey) || 0

    if (attempts >= this.config.maxReconnectAttempts) {
      console.error(`Max reconnect attempts reached for ${dataKey}`)
      this.emit('reconnect-failed', { dataKey })
      return
    }

    this.reconnectAttempts.set(dataKey, attempts + 1)

    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(1.5, attempts),
      30000 // 最大延遲 30 秒
    )

    console.log(`Reconnecting ${dataKey} in ${delay}ms (attempt ${attempts + 1})...`)

    setTimeout(() => {
      this.createConnection(url, dataKey)
    }, delay)
  }

  /**
   * 發送消息到指定連接
   */
  send(dataKey, message) {
    const ws = this.connections.get(dataKey)
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(typeof message === 'string' ? message : JSON.stringify(message))
      return true
    }
    console.warn(`Cannot send message to ${dataKey}: connection not ready`)
    return false
  }

  /**
   * 發布數據到數據流
   */
  publish(dataKey, data) {
    const message = JSON.stringify({
      type: 'publish',
      dataKey: dataKey,
      data: data
    })
    return this.send(dataKey, message)
  }

  /**
   * 關閉指定連接
   */
  closeConnection(dataKey) {
    const ws = this.connections.get(dataKey)
    if (ws) {
      this.clearPing(dataKey)
      ws.close()
      this.connections.delete(dataKey)
      console.log(`Connection ${dataKey} closed`)
    }
  }

  /**
   * 關閉所有連接
   */
  closeAll() {
    console.log('Closing all WebSocket connections...')
    this.connections.forEach((ws, dataKey) => {
      this.clearPing(dataKey)
      ws.close()
    })
    this.connections.clear()
    this.reconnectAttempts.clear()
  }

  /**
   * 獲取連接狀態
   */
  getConnectionStatus(dataKey) {
    const ws = this.connections.get(dataKey)
    if (!ws) return 'disconnected'

    const states = {
      [WebSocket.CONNECTING]: 'connecting',
      [WebSocket.OPEN]: 'connected',
      [WebSocket.CLOSING]: 'closing',
      [WebSocket.CLOSED]: 'disconnected'
    }

    return states[ws.readyState] || 'unknown'
  }

  /**
   * 獲取所有連接狀態
   */
  getAllStatus() {
    const status = {}
    this.connections.forEach((ws, dataKey) => {
      status[dataKey] = this.getConnectionStatus(dataKey)
    })
    return status
  }
}

export default WebSocketManager
