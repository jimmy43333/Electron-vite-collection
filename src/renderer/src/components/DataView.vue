<template>
  <div class="data-view">
    <!-- 視圖切換器 -->
    <div class="view-switcher">
      <button
        v-for="view in views"
        :key="view"
        :class="{ active: currentView === view }"
        @click="switchView(view)"
      >
        {{ view }} ({{ dataCount(view) }})
      </button>
    </div>

    <!-- 使用 Virtua 的虛擬列表 -->
    <div class="list-container">
      <VList :data="currentData" :overscan="5" class="scroller">
        <template #default="{ item, index }">
          <div class="item" :class="{ even: index % 2 === 0 }">
            <span class="index">{{ index + 1 }}</span>
            <span class="id">ID: {{ item.id }}</span>
            <span class="name">{{ item.name || item.title }}</span>
            <span class="timestamp">{{ formatTime(item.timestamp) }}</span>
          </div>
        </template>
      </VList>
    </div>

    <!-- 加載指示器 -->
    <div v-if="isLoading[currentView]" class="loading">
      <div class="spinner"></div>
      <p>載入中...</p>
    </div>

    <!-- 狀態信息 -->
    <div class="status-bar">
      <span>當前視圖: {{ currentView }}</span>
      <span>總筆數: {{ currentData.length }}</span>
      <span>最後更新: {{ lastUpdateTime }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useDataStore } from '../stores/dataStore'
import { VList } from 'virtua/vue'

const store = useDataStore()
const { currentView, currentData, isLoading } = storeToRefs(store)
const { dataCount, switchView } = store

const views = ['data1', 'data2', 'data3', 'data4']
const lastUpdateTime = ref('--:--:--')

// 格式化時間
const formatTime = (timestamp) => {
  if (!timestamp) return '--:--:--'
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 更新最後更新時間
const updateLastUpdateTime = () => {
  lastUpdateTime.value = formatTime(new Date())
}

onMounted(async () => {
  console.log('DataView mounted, initializing...')

  // 初始化所有數據
  await Promise.all(views.map((view) => store.initializeData(view)))

  // 初始化 WebSocket 監聽器
  store.initializeListeners()

  // 監聽更新事件以更新時間
  store.$onAction(({ name, after }) => {
    if (name === 'handleUpdate') {
      after(() => {
        updateLastUpdateTime()
      })
    }
  })

  updateLastUpdateTime()
})

onUnmounted(() => {
  // 清理監聽器
  if (window.api?.removeAllListeners) {
    window.api.removeAllListeners()
  }
})
</script>

<style scoped>
.data-view {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
}

.view-switcher {
  display: flex;
  gap: 8px;
  padding: 16px;
  background: #ffffff;
  border-bottom: 2px solid #e9ecef;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.view-switcher button {
  padding: 10px 20px;
  border: 2px solid #dee2e6;
  background: #ffffff;
  color: #495057;
  cursor: pointer;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s ease;
  font-size: 14px;
}

.view-switcher button:hover {
  background: #f8f9fa;
  border-color: #007bff;
}

.view-switcher button.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.3);
}

.list-container {
  flex: 1;
  overflow: hidden;
  background: white;
  margin: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.scroller {
  height: 100%;
  width: 100%;
}

.item {
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  border-bottom: 1px solid #f1f3f5;
  gap: 20px;
  transition: background-color 0.15s ease;
}

.item:hover {
  background: #f8f9fa;
}

.item.even {
  background: #ffffff;
}

.item.even:hover {
  background: #f8f9fa;
}

.item .index {
  min-width: 50px;
  font-weight: 600;
  color: #6c757d;
  font-size: 13px;
}

.item .id {
  min-width: 120px;
  color: #495057;
  font-family: 'Courier New', monospace;
  font-size: 13px;
}

.item .name {
  flex: 1;
  color: #212529;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item .timestamp {
  min-width: 100px;
  color: #868e96;
  font-size: 12px;
  text-align: right;
  font-family: 'Courier New', monospace;
}

.loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  background: white;
  padding: 30px 40px;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 12px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading p {
  margin: 0;
  color: #495057;
  font-weight: 500;
}

.status-bar {
  display: flex;
  justify-content: space-between;
  padding: 12px 20px;
  background: #ffffff;
  border-top: 1px solid #e9ecef;
  font-size: 13px;
  color: #6c757d;
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.05);
}

.status-bar span {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .view-switcher {
    flex-wrap: wrap;
    gap: 6px;
    padding: 12px;
  }

  .view-switcher button {
    flex: 1;
    min-width: calc(50% - 3px);
    padding: 8px 12px;
    font-size: 13px;
  }

  .item {
    padding: 0 12px;
    gap: 12px;
  }

  .item .index {
    min-width: 40px;
  }

  .item .id {
    display: none;
  }

  .status-bar {
    flex-direction: column;
    gap: 8px;
    font-size: 12px;
  }
}
</style>
