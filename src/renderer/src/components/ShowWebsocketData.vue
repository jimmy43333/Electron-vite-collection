<template>
  <div class="out-box">
    <h2>Receive websocket client and Store Data in SQLite Database</h2>

    <div class="workspace-buttons">
      <button :class="{ active: currentWorkspace === 'Summer' }" @click="switchWorkspace('Summer')">
        Summer
      </button>
      <button :class="{ active: currentWorkspace === 'Winter' }" @click="switchWorkspace('Winter')">
        Winter
      </button>
    </div>

    <!-- WebSocket Control Buttons -->
    <div class="websocket-controls">
      <div class="control-section">
        <h4>WebSocket Connection Control</h4>
        <div class="connection-url">
          <label for="wsUrl">WebSocket URL:</label>
          <input
            id="wsUrl"
            v-model="workspaceConfigs[currentWorkspace].url"
            type="text"
            placeholder="ws://localhost:8080"
            :disabled="workspaceConfigs[currentWorkspace].isConnected"
          />
        </div>
        <div class="connection-status">
          <span
            :class="workspaceConfigs[currentWorkspace].isConnected ? 'connected' : 'disconnected'"
          >
            {{ workspaceConfigs[currentWorkspace].isConnected ? 'connected' : 'disconnected' }}
          </span>
        </div>
        <div class="control-buttons">
          <button :class="getToggleButtonClass()" @click="toggleConnection">
            {{ getToggleButtonText() }}
          </button>
        </div>
      </div>
    </div>
    <div class="virtual-list-container">
      <div class="display-data">
        <h2>&nbsp;&nbsp;Data</h2>
        <select
          v-if="!workspaceConfigs[currentWorkspace].launchConnection"
          v-model="selectedSessionId"
          :disabled="isLoadingSessions"
          class="session-selector"
          @change="onSessionChange"
        >
          <option value="" disabled>
            {{ isLoadingSessions ? 'Loading sessions...' : 'Select a session' }}
          </option>
          <option
            v-for="session in availableSessions"
            :key="session.sessionId"
            :value="session.sessionId"
          >
            ({{ formatTime(session.createdAt) }}) - {{ session.status }}
          </option>
        </select>
      </div>
      <Virtualizer :data="events" :item-size="120" :overscan="5" class="virtual-list">
        <template #default="{ item }">
          <div class="event-item">
            <div class="event-header">
              <span class="event-type">{{ item.type || 'unknown' }}</span>
              <span class="event-time">{{ formatTime(item.timestamp) }}</span>
            </div>
            <div class="event-data">
              <div><strong>Session:</strong> {{ item.sessionId || 'N/A' }}</div>
              <div><strong>Direction:</strong> {{ item.direction || 'N/A' }}</div>
              <div><strong>Size:</strong> {{ item.size || 0 }} bytes</div>
              <div class="data-content">{{ truncateData(item.data) }}</div>
            </div>
          </div>
        </template>
      </Virtualizer>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, onUnmounted } from 'vue'
import { Virtualizer } from 'virtua/vue'

// 響應式數據
const currentWorkspace = ref('Summer')
const events = ref([])

// Session 相關數據
const availableSessions = ref([])
const selectedSessionId = ref('')
const isLoadingSessions = ref(false)

// 狀態檢查定時器
let statusTimer = null

// 當前活躍的監聽器
let activeListeners = []

// 為每個 workspace 保存不同的配置
const workspaceConfigs = ref({
  Summer: {
    url: 'ws://localhost:8765',
    isConnected: false,
    launchConnection: false
  },
  Winter: {
    url: 'ws://localhost:8081',
    isConnected: false,
    launchConnection: false
  }
})

// 切換按鈕方法
async function toggleConnection() {
  if (workspaceConfigs.value[currentWorkspace.value].launchConnection) {
    workspaceConfigs.value[currentWorkspace.value].launchConnection = false
    stopStatusTimer()
    await stopConnection()
  } else {
    workspaceConfigs.value[currentWorkspace.value].launchConnection = true
    await startConnection()
    // 啟動定時器檢查狀態
    startStatusTimer()
  }
}

function getToggleButtonText() {
  return workspaceConfigs.value[currentWorkspace.value].launchConnection
    ? 'Stop Connection'
    : 'Start Connection'
}

function getToggleButtonClass() {
  const baseClasses = ['toggle-btn']
  if (workspaceConfigs.value[currentWorkspace.value].launchConnection) {
    // 已連接時顯示深黃色 Stop Connection 按鈕
    baseClasses.push('connected')
  } else {
    // 未連接時顯示深藍色 Start Connection 按鈕
    baseClasses.push('disconnected')
  }
  return baseClasses
}

// 監聽後端事件
async function switchWorkspace(workspace) {
  console.log(`Switching to workspace: ${workspace}`)

  // 清理之前的監聽器
  cleanupListeners()

  // 設置新的 workspace (計算屬性會自動更新 URL 和狀態)
  currentWorkspace.value = workspace

  try {
    // 確保 SessionManager 存在
    await window.electron.ipcRenderer.sendSync('createSessionManager', workspace)

    // 設置新的監聽器
    setupListeners(workspace)

    // 檢查當前連接狀態
    await checkConnectionStatus()
  } catch (error) {
    console.error(`Failed to switch to workspace ${workspace}:`, error)
  }
}

function setupListeners(workspace) {
  const sessionCreatedListener = (event, data) => {
    console.log(`[${workspace}] Session Created:`, data)
    addNewEvent({
      id: `session-${Date.now()}`,
      type: 'session-created',
      timestamp: Date.now(),
      data: data,
      workspace: workspace
    })
  }

  const websocketDataUpdatedListener = (event, data) => {
    console.log(`[${workspace}] WebSocket Data Updated:`, data)
    addNewEvent({
      id: `websocket-${Date.now()}`,
      type: 'websocket-data-updated',
      timestamp: data.data.timestamp || Date.now(),
      data: data.data,
      workspace: workspace
    })
  }

  const metaDataUpdatedListener = (event, data) => {
    console.log(`[${workspace}] Meta Data Updated:`, data)
    addNewEvent({
      id: `meta-${Date.now()}`,
      type: 'meta-data-updated',
      timestamp: Date.now(),
      data: data,
      workspace: workspace
    })
  }

  // 添加監聽器
  window.electron.ipcRenderer.on(`session-created-${workspace}`, sessionCreatedListener)
  window.electron.ipcRenderer.on(
    `websocket-data-updated-${workspace}`,
    websocketDataUpdatedListener
  )
  window.electron.ipcRenderer.on(`meta-data-updated-${workspace}`, metaDataUpdatedListener)

  // 記錄活躍的監聽器
  activeListeners = [
    { event: `session-created-${workspace}`, listener: sessionCreatedListener },
    { event: `websocket-data-updated-${workspace}`, listener: websocketDataUpdatedListener },
    { event: `meta-data-updated-${workspace}`, listener: metaDataUpdatedListener }
  ]
}

function cleanupListeners() {
  // 移除所有活躍的監聽器
  activeListeners.forEach(({ event, listener }) => {
    window.electron.ipcRenderer.removeListener(event, listener)
  })
  activeListeners = []
}

function addNewEvent(event) {
  // 添加新事件到列表頂部
  events.value.unshift(event)

  // 限制最多顯示 100 筆資料
  if (events.value.length > 100) {
    events.value = events.value.slice(0, 100)
  }
}

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleString()
}

function truncateData(data) {
  if (typeof data === 'string' && data.length > 100) {
    return data.substring(0, 100) + '...'
  }
  return data
}

async function startConnection() {
  const url = workspaceConfigs.value[currentWorkspace.value].url
  if (!url || url.trim() === '') {
    return
  }

  events.value = []

  try {
    // 驗證 URL 格式
    new URL(url)
  } catch (urlError) {
    console.error('Invalid URL format:', url)
    return
  }

  try {
    // 先創建測試 Session
    await window.electron.ipcRenderer.invoke('createTestSession', currentWorkspace.value)
    // 再啟動連接
    await window.electron.ipcRenderer.invoke('startConnection', currentWorkspace.value, url)
  } catch (error) {
    console.error('Failed to start connection:', error)
  }
}

async function stopConnection() {
  try {
    // 先停止連接
    await window.electron.ipcRenderer.invoke('stopConnection', currentWorkspace.value)
    workspaceConfigs.value[currentWorkspace.value].isConnected = false
    // 再關閉測試 Session
    await window.electron.ipcRenderer.invoke('closeTestSession', currentWorkspace.value)
    // 載入該 workspace 的所有 sessions
    await loadAvailableSessions()
  } catch (error) {
    console.error('Failed to stop connection:', error)
  }
}

// 檢查連接狀態的方法
async function checkConnectionStatus() {
  try {
    const result = await window.electron.ipcRenderer.invoke(
      'checkConnection',
      currentWorkspace.value
    )
    const connected = result.status === 'connected'
    workspaceConfigs.value[currentWorkspace.value].isConnected = connected
  } catch (error) {
    console.error('Failed to check connection status:', error)
    workspaceConfigs.value[currentWorkspace.value].isConnected = false
  }
}

// 開始狀態檢查定時器
function startStatusTimer() {
  stopStatusTimer() // 確保沒有重複的定時器
  statusTimer = setInterval(checkConnectionStatus, 1000) // 每秒檢查一次
}

// 停止狀態檢查定時器
function stopStatusTimer() {
  if (statusTimer) {
    clearInterval(statusTimer)
    statusTimer = null
  }
}

// 載入該 workspace 的所有 sessions
async function loadAvailableSessions() {
  try {
    isLoadingSessions.value = true
    const sessions = await window.electron.ipcRenderer.invoke(
      'getAllSessions',
      currentWorkspace.value
    )
    availableSessions.value = sessions
    console.log(`載入 ${currentWorkspace.value} 的 sessions:`, sessions)
  } catch (error) {
    console.error('Failed to load sessions:', error)
    availableSessions.value = []
  } finally {
    isLoadingSessions.value = false
  }
}

// 當 session 選擇改變時的處理方法
async function onSessionChange() {
  if (!selectedSessionId.value) {
    events.value = []
    return
  }

  try {
    console.log(`切換到 session: ${selectedSessionId.value}`)

    // 根據選中的 session 載入對應的數據
    const sessionEvents = await window.electron.ipcRenderer.invoke(
      'getSessionWebSocketData',
      currentWorkspace.value,
      selectedSessionId.value,
      50
    )
    events.value = sessionEvents
    console.log(`載入 session ${selectedSessionId.value} 的資料:`, sessionEvents.length, '筆')
  } catch (error) {
    console.error('Failed to load session data:', error)
    events.value = []
  }
}

onMounted(async () => {
  // 初始化創建 SessionManager
  await window.electron.ipcRenderer.sendSync('createSessionManager', 'Summer')
  await window.electron.ipcRenderer.sendSync('createSessionManager', 'Winter')
  switchWorkspace('Summer')
  await loadAvailableSessions()
})

onUnmounted(() => {
  cleanupListeners()
  stopStatusTimer() // 清理定時器
})
</script>

<style lang="less" scoped>
.out-box {
  width: 100%;
  height: 100vh;
  padding: 20px;
  overflow: scroll;
}

.workspace-buttons {
  margin: 20px 0;
}

.workspace-buttons button {
  margin-right: 10px;
  padding: 10px 20px;
  background: #585858;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.workspace-buttons button:hover {
  background: #ff9100;
}

.workspace-buttons button.active {
  background: #924200;
  color: white;
}

/* WebSocket Controls Styling */
.websocket-controls {
  margin: 20px 0;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #dee2e6;
  border-left: 4px solid #924200;
}

.control-section h4 {
  margin: 0 0 15px 0;
  color: #333;
}

.connection-status {
  margin-bottom: 15px;
}

.connection-status .connected {
  color: #28a745;
  font-weight: bold;
}

.connection-status .connecting {
  color: #ffc107;
  font-weight: bold;
}

.connection-status .disconnecting {
  color: #ffc107;
  font-weight: bold;
}

.connection-status .disconnected {
  color: #dc3545;
  font-weight: bold;
}

.control-buttons {
  margin-bottom: 10px;
}

.control-buttons button {
  margin-right: 10px;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.control-buttons .toggle-btn {
  color: white;
  transition: background-color 0.3s ease;
  font-weight: bold;
}

.control-buttons .toggle-btn.connected {
  background: #b8860b; /* 深黃色 - Stop Connection */
}

.control-buttons .toggle-btn.disconnected {
  background: #924200; /* 深橘色 - Start Connection */
}

.control-buttons .toggle-btn.connecting {
  background: #6c757d;
  color: white;
  cursor: not-allowed;
}

.control-buttons .toggle-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.connection-url {
  margin-top: 10px;
}

.connection-url input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ced4da;
  border-radius: 4px;
}

.display-data {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  justify-content: space-between;
}

.session-selector {
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  background-color: white;
  font-size: 14px;
  color: #333;
  max-width: 200px;
  cursor: pointer;
}

.session-selector:disabled {
  background-color: #f8f9fa;
  color: #6c757d;
  cursor: not-allowed;
}

.session-selector:focus {
  outline: none;
  border-color: #924200;
  box-shadow: 0 0 0 2px rgba(146, 66, 0, 0.2);
}

.virtual-list-container {
  width: 100%;
  height: 400px;
  border: 1px solid #000000;
  border-radius: 4px;
  overflow: scroll;
}

.virtual-list {
  height: 100%;
  width: 100%;
}

.event-item {
  background: white;
  padding: 12px;
  margin: 4px 8px;
  border-radius: 4px;
  border: 1px dotted #0d00c0;
  height: auto;
  box-sizing: border-box;
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid #818181;
}

.event-type {
  font-weight: bold;
  color: #333;
  background: #e9ecef;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
}

.event-time {
  font-size: 11px;
  color: #666;
}

.event-data {
  font-size: 13px;
  color: #555;
}

.event-data div {
  margin: 2px 0;
}

.event-data strong {
  color: #333;
  margin-right: 5px;
}

.data-content {
  margin-top: 8px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 3px;
  font-family: monospace;
  font-size: 11px;
  max-height: 40px;
  overflow: hidden;
  word-break: break-all;
}
</style>
