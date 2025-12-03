<template>
  <div class="out-box">
    <h2>Receive websocket client and Store Data in SQLite Database</h2>

    <div class="workspace-buttons">
      <button @click="createWorkspace('Summer')">Summer</button>
      <button @click="createWorkspace('Winter')">Winter</button>
    </div>

    <div class="event-listener">
      <h3>即時事件監聽</h3>
      <button :class="{ active: isListening }" @click="toggleEventListener">
        {{ isListening ? '停止監聽' : '開始監聽' }}
      </button>

      <div v-if="events.length > 0" class="events-display">
        <h4>最新事件 ({{ events.length }})</h4>
        <div v-for="(event, index) in events.slice(0, 10)" :key="index" class="event-item">
          <div class="event-header">
            <span class="event-type">{{ event.type }}</span>
            <span class="event-time">{{ event.timestamp }}</span>
          </div>
          <div class="event-data">
            <strong>Workspace:</strong> {{ event.data.workspace }}<br />
            <strong>Session ID:</strong> {{ event.data.sessionId }}
            <div v-if="event.type === 'websocket-data-updated'">
              <strong>Table:</strong> {{ event.data.tableName }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, onUnmounted } from 'vue'

const events = ref([])
const isListening = ref(false)

const createWorkspace = async (workspaceName) => {
  await window.electron.ipcRenderer.sendSync('createSessionManager', workspaceName)
  console.log(`Created SessionManager for workspace: ${workspaceName}`)
}

const toggleEventListener = () => {
  if (isListening.value) {
    stopListening()
  } else {
    startListening()
  }
}

const startListening = () => {
  if (window.sessionManager) {
    isListening.value = true

    window.sessionManager.onSessionCreated((event, data) => {
      addEvent('session-created', data)
    })

    window.sessionManager.onWebsocketDataUpdated((event, data) => {
      addEvent('websocket-data-updated', data)
    })

    window.sessionManager.onMetaDataUpdated((event, data) => {
      addEvent('meta-data-updated', data)
    })

    console.log('Event listening started')
  }
}

const stopListening = () => {
  if (window.sessionManager) {
    window.sessionManager.removeAllListeners('session-created')
    window.sessionManager.removeAllListeners('websocket-data-updated')
    window.sessionManager.removeAllListeners('meta-data-updated')

    isListening.value = false
    console.log('Event listening stopped')
  }
}

const addEvent = (type, data) => {
  const event = {
    type,
    data,
    timestamp: new Date().toLocaleTimeString()
  }

  events.value.unshift(event)

  // 保留最新的 50 個事件
  if (events.value.length > 50) {
    events.value = events.value.slice(0, 50)
  }
}

onMounted(async () => {
  await createWorkspace('Summer')
  await createWorkspace('Winter')
})

onUnmounted(() => {
  if (isListening.value) {
    stopListening()
  }
})
</script>

<style lang="less" scoped>
.out-box {
  width: 100%;
  height: 100%;
  padding: 50px;
  overflow-y: scroll;
}

.workspace-buttons {
  margin: 20px 0;
}

.workspace-buttons button {
  margin-right: 10px;
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.workspace-buttons button:hover {
  background: #0056b3;
}

.event-listener {
  margin-top: 30px;
  padding: 20px;
  background: #5f5f5f;
  border-radius: 8px;
}

.event-listener button {
  padding: 8px 16px;
  border: 1px solid #ccc;
  background: #313131;
  border-radius: 4px;
  cursor: pointer;
}

.event-listener button.active {
  background: #28a745;
  color: white;
  border-color: #28a745;
}

.events-display {
  margin-top: 20px;
}

.event-item {
  background: white;
  margin: 10px 0;
  padding: 12px;
  border-radius: 4px;
  border-left: 4px solid #007bff;
}

.event-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.event-type {
  font-weight: bold;
  color: #333;
}

.event-time {
  font-size: 12px;
  color: #666;
}

.event-data {
  font-size: 14px;
  color: #555;
}
</style>
