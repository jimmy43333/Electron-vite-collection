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
        console.log('📨 sessionCreated event received in main process')
        mainWindow.webContents.send(`session-created-${key}`, data)
      })

      manager.on('websocketDataUpdated', (data) => {
        console.log('📨 websocketDataUpdated event received in main process')
        mainWindow.webContents.send(`websocket-data-updated-${key}`, data)
      })

      manager.on('metaDataUpdated', (data) => {
        console.log('📨 metaDataUpdated event received in main process')
        mainWindow.webContents.send(`meta-data-updated-${key}`, data)
      })

      if (!websocketClient.has(key)) {
        const wsClient = new WebSocketClient(key, manager)
        websocketClient.set(key, wsClient)
      }
    }

    event.returnValue = true
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

  // 獲取 workspace 中所有的 sessions
  ipcMain.handle('getAllSessions', async (event, workspaceKey, options = {}) => {
    try {
      if (!sessionManager.has(workspaceKey)) {
        return []
      }

      const manager = sessionManager.get(workspaceKey)
      const sessions = await manager.getHistorySessions(options)

      console.log(
        `✅ 獲取 workspace (${workspaceKey}) 所有 sessions 成功，共 ${sessions.length} 筆`
      )
      return sessions
    } catch (error) {
      console.error(`❌ 獲取 workspace sessions 失敗:`, error)
      return []
    }
  })

  // 根據 sessionId 獲取特定 session 的資料
  ipcMain.handle('getSessionById', async (event, workspaceKey, sessionId) => {
    try {
      if (!sessionManager.has(workspaceKey)) {
        return null
      }

      const manager = sessionManager.get(workspaceKey)
      const session = await manager.getHistorySessionInfo(sessionId)

      console.log(`✅ 獲取 session (${sessionId}) 詳細資訊成功`)
      return session
    } catch (error) {
      console.error(`❌ 獲取 session 詳細資訊失敗:`, error)
      return null
    }
  })

  // 獲取特定 session 的 WebSocket 資料
  ipcMain.handle('getSessionWebSocketData', async (event, workspaceKey, sessionId, limit = 50) => {
    try {
      if (!sessionManager.has(workspaceKey)) {
        return []
      }

      const manager = sessionManager.get(workspaceKey)
      const websocketData = await manager.getSessionWebSocketData(sessionId, limit)

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

      console.log(`✅ 獲取 session (${sessionId}) WebSocket 資料成功，共 ${events.length} 筆`)
      return events
    } catch (error) {
      console.error(`❌ 獲取 session WebSocket 資料失敗:`, error)
      return []
    }
  })
}
