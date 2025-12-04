import { ipcMain } from 'electron'

/**
 * 註冊 WebSocket 客戶端相關的 IPC handlers
 * @param {Map} websocketClient - WebSocket 客戶端 Map
 */
export function registerWebSocketClientHandlers(websocketClient) {
  // 簡化版：僅建立連接，不等待結果
  ipcMain.handle('startConnection', async (event, workspaceKey, url = 'ws://localhost:8080') => {
    try {
      if (!websocketClient.has(workspaceKey)) {
        return { result: false, message: 'WebSocket client not found for workspace' }
      }
      const client = websocketClient.get(workspaceKey)
      client.connect(url)
      return { result: true, message: `Create Connection to {url}` }
    } catch (error) {
      console.error(`❌ 啟動 WebSocket 連接失敗:`, error)
      return { result: false, message: error.message }
    }
  })

  ipcMain.handle('stopConnection', async (event, workspaceKey) => {
    try {
      if (!websocketClient.has(workspaceKey)) {
        return { result: false, message: 'WebSocket client not found for workspace' }
      }
      const client = websocketClient.get(workspaceKey)
      client.disconnect()
      return { result: true, message: 'Connection stopped' }
    } catch (error) {
      console.error(`❌ 停止 WebSocket 連接失敗:`, error)
      return { result: false, message: error.message }
    }
  })

  // 檢查連接狀態
  ipcMain.handle('checkConnection', async (event, workspaceKey) => {
    try {
      // 如果客戶端不存在，返回默認狀態
      if (!websocketClient.has(workspaceKey)) {
        return { status: 'disconnected', message: 'disconnected' }
      }

      const client = websocketClient.get(workspaceKey)
      const rawStatus = client.getConnectionStatus()

      // 映射狀態
      const status = rawStatus === 'closing' ? 'disconnecting' : rawStatus
      const message = status

      return {
        status: status,
        message: message,
        workspace: workspaceKey
      }
    } catch (error) {
      console.error(`❌ 獲取 WebSocket 狀態失敗:`, error)
      return { status: 'disconnected', message: 'disconnected' }
    }
  })
}
