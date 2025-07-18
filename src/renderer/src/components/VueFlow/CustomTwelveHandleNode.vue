<template>
  <div class="custom-node">
    <div class="custom-node-content">
      {{ data.label }}
    </div>
    <Handle id="top-left-T" type="target" :position="Position.Top" :style="{ left: '20%' }" />
    <Handle id="top-left-S" type="source" :position="Position.Top" :style="{ left: '20%' }" />
    <Handle id="top-right-T" type="target" :position="Position.Top" :style="{ left: '80%' }" />
    <Handle id="top-right-S" type="source" :position="Position.Top" :style="{ left: '80%' }" />
    <Handle id="top-middle-T" type="target" :position="Position.Top" />
    <Handle id="top-middle-S" type="source" :position="Position.Top" />
    <Handle id="down-left-T" type="target" :position="Position.Bottom" :style="{ left: '20%' }" />
    <Handle id="down-left-S" type="source" :position="Position.Bottom" :style="{ left: '20%' }" />
    <Handle id="down-right-T" type="target" :position="Position.Bottom" :style="{ left: '80%' }" />
    <Handle id="down-right-S" type="source" :position="Position.Bottom" :style="{ left: '80%' }" />
    <Handle id="down-middle-T" type="target" :position="Position.Bottom" />
    <Handle id="down-middle-S" type="source" :position="Position.Bottom" />
    <Handle id="right-top-T" type="target" :position="Position.Right" :style="{ top: '20%' }" />
    <Handle id="right-top-S" type="source" :position="Position.Right" :style="{ top: '20%' }" />
    <Handle id="right-down-T" type="target" :position="Position.Right" :style="{ top: '80%' }" />
    <Handle id="right-down-S" type="source" :position="Position.Right" :style="{ top: '80%' }" />
    <Handle id="right-middle-T" type="target" :position="Position.Right" />
    <Handle id="right-middle-S" type="source" :position="Position.Right" />
    <Handle id="left-top-T" type="target" :position="Position.Left" :style="{ top: '20%' }" />
    <Handle id="left-top-S" type="source" :position="Position.Left" :style="{ top: '20%' }" />
    <Handle id="left-down-T" type="target" :position="Position.Left" :style="{ top: '80%' }" />
    <Handle id="left-down-S" type="source" :position="Position.Left" :style="{ top: '80%' }" />
    <Handle id="left-middle-T" type="target" :position="Position.Left" />
    <Handle id="left-middle-S" type="source" :position="Position.Left" />
  </div>
</template>

<script setup>
import { Position, Handle } from '@vue-flow/core'
const props = defineProps(['data'])
</script>

<style scoped>
.custom-node {
  background: azure;
  border: 3px solid #2196f3;
  border-radius: 5px;
  position: relative;
  min-width: 100px;
  text-align: center;
}

.custom-node-content {
  margin: 10px;
  color: black;
  font-weight: 600;
}

/* Change handle appearance */
.vue-flow__handle {
  background: #2196f3;
  /* box-shadow: 0 0 4px #ff5722; */
  transition: background 0.2s;
}

.vue-flow__handle:hover {
  background: #2196f3;
}
</style>
