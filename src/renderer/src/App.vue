<template>
  <img alt="logo" class="logo" src="./assets/electron.svg" />
  <div class="creator">Powered by electron-vite</div>
  <div class="text">
    Build an Electron app with
    <span class="vue">Vue</span>
  </div>
  <p class="tip">Please try pressing <code>F12</code> to open the devTool</p>
  <div class="actions">
    <div class="action">
      <a href="https://electron-vite.org/" target="_blank" rel="noreferrer">Documentation</a>
    </div>
    <div class="action">
      <a target="_blank" rel="noreferrer" @click="ipcHandle('ping')">Send IPC</a>
    </div>
    <div class="action">
      <a target="_blank" rel="noreferrer" @click="ipcHandle('save_log')">Save Log</a>
    </div>
    <div class="action">
      <RouterLink to="/vueRouterDemo">vue-router</RouterLink>
    </div>
  </div>
  <Versions />
  <div v-if="$route.path != '/'" class="router-viewer-container">
    <RouterView />
  </div>
  <RouterLink to="/" class="home-click">
    <ion-icon :icon="home" class="panel-icon" />
  </RouterLink>
</template>
<script setup>
import { IonIcon } from '@ionic/vue'
import { home } from 'ionicons/icons'
import Versions from './components/Versions.vue'
import { RouterView, RouterLink } from 'vue-router'

const ipcHandle = (action) => window.electron.ipcRenderer.send(action)
</script>
<style lang="less">
.router-viewer-container {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  background-color: #3c4763;
}

.home-click {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 40px;
  height: 40px;
  margin: 10px;
  background-color: #202127;
  border-radius: 20%;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover {
    background-color: #463f3a;
  }
}

.panel-icon {
  font-size: 20px;
  color: azure;
}
</style>
