<template>
  <div class="empty-box">
    <h2>Get External JSON Config in production application</h2>
    <button @click="getConfig">Get</button>
    <button v-if="data" @click="saveConfig">Save</button>
    <div v-show="data">
      <div ref="jsonEditorContainer" style="height: 400px"></div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import JSONEditor from 'jsoneditor'
import 'jsoneditor/dist/jsoneditor.css'

const data = ref(null)
const jsonEditorContainer = ref(null)
let editor = null

watch(data, (val) => {
  if (jsonEditorContainer.value) {
    if (!editor) {
      editor = new JSONEditor(jsonEditorContainer.value, {
        mode: 'tree',
        mainMenuBar: false,
        onChange: () => {}
      })
    }
    editor.set(val || {})
  }
})

function getConfig() {
  window.electron.ipcRenderer.invoke('getExternalConfig').then((result) => {
    data.value = result
    if (editor) {
      editor.destroy()
    }
    editor = new JSONEditor(jsonEditorContainer.value, {
      mode: 'tree',
      modes: ['view', 'form', 'code', 'tree'],
      onChange: () => {
        console.log(editor.get())
      }
    })
    editor.set(data.value)
  })
}

function saveConfig() {
  if (editor) {
    const updatedConfig = editor.get()
    window.electron.ipcRenderer
      .invoke('saveExternalConfig', updatedConfig)
      .then(() => {
        alert('Config saved!')
      })
      .catch((err) => {
        alert('Failed to save config: ' + err)
      })
  }
}

onMounted(() => {
  console.log(' component mounted')
})
</script>

<style lang="less">
.empty-box {
  width: 100%;
  height: 100%;
  padding: 50px;
  overflow-y: scroll;
}
</style>
