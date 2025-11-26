<template>
  <div class="websocket-outbox">
    <h2>Update Large Data with Websocket</h2>

    <!-- WebSocket 訊息發送控制面板 -->
    <div class="message-control-panel">
      <div class="connection-config">
        <div class="control-group">
          <label for="sender-select">發送者:</label>
          <select id="sender-select" v-model="selectedSender" class="websocket-select">
            <option value="" disabled>請選擇發送者</option>
            <option v-for="ws in availableWebSockets" :key="ws.dataKey" :value="ws.dataKey">
              {{ ws.name }} ({{ ws.status }})
            </option>
          </select>
        </div>

        <div class="control-group">
          <label for="receiver-select">接收者:</label>
          <select id="receiver-select" v-model="selectedReceiver" class="websocket-select">
            <option value="" disabled>請選擇接收者</option>
            <option v-for="ws in availableWebSockets" :key="ws.dataKey" :value="ws.dataKey">
              {{ ws.name }} ({{ ws.status }})
            </option>
          </select>
        </div>
      </div>

      <div class="control-group">
        <label for="message-input">訊息內容:</label>
        <div class="message-input-group">
          <textarea
            id="message-input"
            v-model="messageText"
            placeholder="輸入要發送的訊息..."
            rows="3"
            class="message-input"
          ></textarea>
          <button
            :disabled="
              !selectedSender ||
              !selectedReceiver ||
              !messageText.trim() ||
              isSending ||
              selectedSender === selectedReceiver
            "
            class="send-button"
            @click="sendMessage"
          >
            {{ isSending ? '發送中...' : '發送訊息' }}
          </button>
        </div>
      </div>

      <!-- 連線資訊顯示 -->
      <div v-if="selectedSender && selectedReceiver" class="connection-info">
        <div class="info-item">
          <span class="label">發送者:</span>
          <span class="value">{{ getWebSocketName(selectedSender) }}</span>
          <span class="status" :class="getWebSocketStatus(selectedSender)">
            {{ getWebSocketStatus(selectedSender) }}
          </span>
        </div>
        <div class="info-item">
          <span class="label">接收者:</span>
          <span class="value">{{ getWebSocketName(selectedReceiver) }}</span>
          <span class="status" :class="getWebSocketStatus(selectedReceiver)">
            {{ getWebSocketStatus(selectedReceiver) }}
          </span>
        </div>
        <div v-if="selectedSender === selectedReceiver" class="warning">
          ⚠️ 發送者和接收者不能是同一個 WebSocket
        </div>
      </div>

      <!-- 發送狀態顯示 -->
      <div
        v-if="lastSendResult"
        class="send-result"
        :class="lastSendResult.success ? 'success' : 'error'"
      >
        {{ lastSendResult.message }}
      </div>
    </div>
    <DataView />
  </div>
</template>

<script setup>
import { onMounted, ref, onUnmounted } from 'vue'
import DataView from './DataView.vue'

// 響應式變數
const selectedSender = ref('')
const selectedReceiver = ref('')
const messageText = ref('')
const isSending = ref(false)
const lastSendResult = ref(null)
const availableWebSockets = ref([
  { dataKey: 'data1', name: 'WebSocket 1', status: 'disconnected' },
  { dataKey: 'data2', name: 'WebSocket 2', status: 'disconnected' },
  { dataKey: 'data3', name: 'WebSocket 3', status: 'disconnected' }
])

// 發送訊息方法
const sendMessage = async () => {
  if (
    !selectedSender.value ||
    !selectedReceiver.value ||
    !messageText.value.trim() ||
    selectedSender.value === selectedReceiver.value
  ) {
    return
  }

  isSending.value = true
  lastSendResult.value = null

  try {
    // 構建要發送的訊息，包含接收者資訊
    const messageData = {
      to: selectedReceiver.value,
      from: selectedSender.value,
      content: messageText.value,
      timestamp: new Date().toISOString()
    }

    // 調用 IPC 通過發送者的 WebSocket 連線發送訊息
    const result = await window.api.publishData({
      dataKey: selectedSender.value,
      message: JSON.stringify(messageData)
    })

    lastSendResult.value = {
      success: result.success,
      message: result.success
        ? `訊息已透過 ${getWebSocketName(selectedSender.value)} 發送到 ${getWebSocketName(selectedReceiver.value)}`
        : `發送失敗: ${result.error || result.message}`
    }

    // 如果發送成功，清空輸入框
    if (result.success) {
      messageText.value = ''
    }
  } catch (error) {
    lastSendResult.value = {
      success: false,
      message: `發送錯誤: ${error.message}`
    }
  } finally {
    isSending.value = false

    // 3秒後清除結果顯示
    setTimeout(() => {
      lastSendResult.value = null
    }, 3000)
  }
}

// 獲取 WebSocket 名稱
const getWebSocketName = (dataKey) => {
  const ws = availableWebSockets.value.find((w) => w.dataKey === dataKey)
  return ws ? ws.name : dataKey
}

// 獲取 WebSocket 狀態
const getWebSocketStatus = (dataKey) => {
  const ws = availableWebSockets.value.find((w) => w.dataKey === dataKey)
  return ws ? ws.status : 'disconnected'
}

// 更新 WebSocket 狀態
const updateWebSocketStatus = async () => {
  try {
    const status = await window.api.getAllWSStatus()
    availableWebSockets.value.forEach((ws) => {
      ws.status = status.status[ws.dataKey] || 'disconnected'
    })
  } catch (error) {
    console.error('Failed to get WebSocket status:', error)
  }
}

// 定期更新狀態
let statusInterval = null

onMounted(() => {
  console.log('component mounted')

  // 初始化狀態
  updateWebSocketStatus()
  // 每5秒更新一次狀態
  statusInterval = setInterval(updateWebSocketStatus, 2000)
})

onUnmounted(() => {
  if (statusInterval) {
    clearInterval(statusInterval)
  }
})
</script>

<style lang="less">
.websocket-outbox {
  width: 100%;
  height: 100%;
  padding: 50px;
  overflow: auto;
}

/* WebSocket 訊息發送控制面板樣式 */
.message-control-panel {
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.control-group {
  margin-bottom: 15px;
}

.control-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #333;
}

.websocket-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  font-size: 14px;
}

.websocket-select:focus {
  outline: none;
  border-color: #007acc;
  box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
}

.message-input-group {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.message-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  min-height: 60px;
}

.message-input:focus {
  outline: none;
  border-color: #007acc;
  box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
}

.send-button {
  padding: 8px 16px;
  background-color: #007acc;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
  height: fit-content;
  min-height: 36px;
}

.send-button:hover:not(:disabled) {
  background-color: #005a9e;
}

.send-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.send-result {
  padding: 10px;
  border-radius: 4px;
  font-size: 14px;
  margin-top: 10px;
}

.send-result.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.send-result.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

/* 連線配置樣式 */
.connection-config {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 20px;
}

@media (max-width: 768px) {
  .connection-config {
    grid-template-columns: 1fr;
  }
}

/* 連線資訊顯示樣式 */
.connection-info {
  background-color: rgba(0, 122, 204, 0.1);
  border: 1px solid rgba(0, 122, 204, 0.3);
  border-radius: 6px;
  padding: 15px;
  margin-top: 15px;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  gap: 8px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-item .label {
  font-weight: 500;
  color: #333;
  min-width: 60px;
}

.info-item .value {
  color: #007acc;
  font-weight: 500;
}

.info-item .status {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
}

.status.connected {
  background-color: #d4edda;
  color: #155724;
}

.status.disconnected {
  background-color: #f8d7da;
  color: #721c24;
}

.status.connecting {
  background-color: #fff3cd;
  color: #856404;
}

.warning {
  background-color: #fff3cd;
  color: #856404;
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid #ffeaa7;
  margin-top: 10px;
  font-size: 14px;
}
</style>
