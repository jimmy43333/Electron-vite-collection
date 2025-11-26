// stores/dataStore.js
import { defineStore } from 'pinia'

export const useDataStore = defineStore('data', {
  state: () => ({
    data1: [],
    data2: [],
    data3: [],
    data4: [],
    currentView: 'data1',
    isLoading: {
      data1: false,
      data2: false,
      data3: false,
      data4: false
    }
  }),

  getters: {
    currentData(state) {
      return state[state.currentView]
    },

    dataCount: (state) => (dataKey) => {
      return state[dataKey]?.length || 0
    }
  },

  actions: {
    // 初始化數據
    async initializeData(dataKey) {
      this.isLoading[dataKey] = true
      try {
        const data = await window.api.getInitialData(dataKey)
        console.log(`Initial data for ${dataKey}:`, data)
        this[dataKey] = data.data
      } catch (error) {
        console.error(`Failed to load ${dataKey}:`, error)
      } finally {
        this.isLoading[dataKey] = false
      }
    },

    // 處理增量更新
    handleUpdate(dataKey, updateData) {
      if (updateData.type === 'full') {
        this[dataKey] = updateData.data
      } else if (updateData.type === 'update') {
        updateData.updates.forEach((update) => {
          const index = this[dataKey].findIndex((item) => item.id === update.id)
          if (index !== -1) {
            this[dataKey][index] = { ...this[dataKey][index], ...update }
          } else {
            this[dataKey].push(update)
          }
        })
      }
    },

    // 切換視圖
    switchView(viewName) {
      this.currentView = viewName
    },

    // 初始化所有監聽器
    initializeListeners() {
      ;['data1', 'data2', 'data3', 'data4'].forEach((dataKey) => {
        window.api.onDataUpdate(dataKey, (data) => {
          this.handleUpdate(dataKey, data)
        })
      })
    }
  }
})
