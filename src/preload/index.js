import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom API for session manager events
const sessionManagerAPI = {
  // Listen to session manager events from main process
  onSessionCreated: (callback) => ipcRenderer.on('session-created', callback),
  onWebsocketDataUpdated: (callback) => ipcRenderer.on('websocket-data-updated', callback),
  onMetaDataUpdated: (callback) => ipcRenderer.on('meta-data-updated', callback),

  // Remove event listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('sessionManager', sessionManagerAPI)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.sessionManager = sessionManagerAPI
}
