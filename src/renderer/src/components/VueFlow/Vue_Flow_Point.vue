<template>
  <div class="vue-flow-point-container">
    <VueFlow
      :nodes="nodes"
      :edges="edges"
      :node-types="nodeTypes"
      :fit-view="false"
      :zoom-on-scroll="false"
      :pan-on-scroll="false"
      :pan-on-drag="false"
      :nodes-draggable="false"
    ></VueFlow>
  </div>
</template>

<script setup>
import { ref, markRaw } from 'vue'
import { VueFlow } from '@vue-flow/core'
import CustomPointNode from './CustomPointNode.vue'
const nodeTypes = {
  custom: markRaw(CustomPointNode)
}
const nodes = ref([
  {
    id: 'center',
    type: 'custom',
    position: { x: 73, y: 73 },
    data: { label: '' }
  },
  {
    id: 'target1',
    type: 'custom',
    position: { x: 30, y: 10 },
    data: { label: 'CH1' }
  },
  {
    id: 'target2',
    type: 'custom',
    position: { x: 115, y: 10 },
    data: { label: 'CH2' }
  },
  {
    id: 'target3',
    type: 'custom',
    position: { x: 145, y: 73 },
    data: { label: 'CH3' }
  },
  {
    id: 'target4',
    type: 'custom',
    position: { x: 115, y: 135 },
    data: { label: 'CH4' }
  },
  {
    id: 'target5',
    type: 'custom',
    position: { x: 30, y: 135 },
    data: { label: 'CH5' }
  },
  {
    id: 'target6',
    type: 'custom',
    position: { x: 0, y: 73 },
    data: { label: 'CH6' }
  }
])

const edges = ref([
  {
    id: 'e1-2',
    source: 'center',
    target: 'center',
    type: 'straight',
    animated: true,
    style: { stroke: 'yellow', strokeWidth: 6 }
  }
])

window.electron.ipcRenderer.on('switch_channel', (event, channel, message) => {
  let index = channel.replace('CH', '')
  edges.value = [
    {
      ...edges.value[0],
      target: `target${index}`
    }
  ]
})
</script>

<style>
@import '@vue-flow/core/dist/style.css';
/* import the default theme, this is optional but generally recommended */
@import '@vue-flow/core/dist/theme-default.css';
.vue-flow-point-container {
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 50%;
}
</style>
