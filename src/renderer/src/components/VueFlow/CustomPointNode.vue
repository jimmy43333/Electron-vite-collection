<template>
  <div class="circle-node">
    <div class="circle-label">{{ data.label }}</div>
    <Handle
      type="source"
      :position="'bottom'"
      :style="{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)', zIndex: '-1' }"
    />
  </div>
</template>

<script setup>
import { Handle } from '@vue-flow/core'
defineProps({
  data: {
    type: Object,
    default: () => ({})
  }
})
</script>

<style scoped>
.circle-node {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  background-color: #b2a59f;
  border: 1px solid azure;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.circle-label {
  color: #030923;
  font-size: 12px;
  font-weight: bold;
  z-index: 1;
  pointer-events: none;
  user-select: none;
  position: absolute;
}
</style>
