<template>
  <div class="empty-content">
    <h2>One Point Node</h2>
    <div class="switch-flow">
      <VueFlowPoint />
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import VueFlowPoint from './VueFlow/Vue_Flow_Point.vue'

onMounted(() => {
  console.log(' component mounted')
})
</script>

<style lang="less">
.switch-flow {
  width: 180px;
  height: 180px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 10px auto;
}
</style>
