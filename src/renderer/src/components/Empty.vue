<template>
  <div class="empty-box">
    <h2>Nothing to see here</h2>
    <p>This is an empty component.</p>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'

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
