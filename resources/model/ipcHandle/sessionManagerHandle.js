import { ipcMain } from 'electron'
import { SessionManager } from '../SQLiteDataBase/SessionManager.js'
import { WebSocketClient } from '../websocketClient.js'

/**
 * 註冊 SessionManager 相關的 IPC handlers
 * @param {Map} sessionManager - Session 管理器 Map
 * @param {Map} websocketClient - WebSocket 客戶端 Map
 * @param {BrowserWindow} mainWindow - 主視窗實例
 */
export function registerSessionManagerHandlers(sessionManager, websocketClient, mainWindow) {
  // 創建 SessionManager
  ipcMain.on('createSessionManager', async (event, key) => {
    // Add key to Map
    if (!sessionManager.has(key)) {
      const manager = new SessionManager(key)
      sessionManager.set(key, manager)

      // 監聽 SessionManager 事件並轉發到前端，使用 workspace 特定的事件名稱
      manager.on('sessionCreated', (data) => {
        mainWindow.webContents.send(`session-created-${key}`, data)
      })

      manager.on('websocketDataUpdated', (data) => {
        mainWindow.webContents.send(`websocket-data-updated-${key}`, data)
      })

      manager.on('metaDataUpdated', (data) => {
        mainWindow.webContents.send(`meta-data-updated-${key}`, data)
      })

      if (!websocketClient.has(key)) {
        const wsClient = new WebSocketClient(key, manager)
        websocketClient.set(key, wsClient)
      }
    }

    event.returnValue = true
  })

  // 獲取 workspace 的最新 50 筆事件資料
  ipcMain.handle('getWorkspaceEvents', async (event, workspaceKey, limit = 50) => {
    try {
      if (!sessionManager.has(workspaceKey)) {
        return []
      }

      const manager = sessionManager.get(workspaceKey)
      if (!manager.currentSessionDb) {
        return []
      }

      // 獲取最新的 websocket 資料 - 使用輪轉表查詢
      const websocketData = await manager.currentSessionDb.selectFromRotatedTables(
        'websocket_data',
        {},
        {
          orderBy: 'timestamp',
          order: 'DESC',
          limit: limit
        }
      )

      // 格式化資料
      const events = websocketData.map((item) => ({
        id: item.id || `${item._sourceTable || 'websocket'}-${item.timestamp}`,
        type: 'websocket-data',
        timestamp: item.timestamp,
        sessionId: item.sessionId,
        data: item.data,
        direction: item.direction,
        size: item.size,
        workspace: workspaceKey,
        sourceTable: item._sourceTable
      }))

      return events // 已經按時間戳降序排列
    } catch (error) {
      console.error(`❌ 獲取 workspace 事件失敗:`, error)
      return []
    }
  })

  // 創建測試 Session
  ipcMain.handle('createTestSession', async (event, workspaceKey) => {
    try {
      if (!sessionManager.has(workspaceKey)) {
        return { success: false, message: 'SessionManager not found' }
      }

      const manager = sessionManager.get(workspaceKey)
      await manager.createTestSession()

      return { success: true, message: 'Test session created' }
    } catch (error) {
      console.error(`❌ 創建測試 session 失敗:`, error)
      return { success: false, message: error.message }
    }
  })

  // 關閉測試 Session
  ipcMain.handle('closeTestSession', async (event, workspaceKey) => {
    try {
      if (!sessionManager.has(workspaceKey)) {
        return { success: false, message: 'SessionManager not found' }
      }

      const manager = sessionManager.get(workspaceKey)
      manager.closeTestSession()

      return { success: true, message: 'Test session closed' }
    } catch (error) {
      console.error(`❌ 關閉測試 session 失敗:`, error)
      return { success: false, message: error.message }
    }
  })
}
