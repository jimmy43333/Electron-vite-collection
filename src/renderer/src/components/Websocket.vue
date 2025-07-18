<template>
  <div class="empty-content">
    <h1>Nothing to see here</h1>
    <p>This is an empty component.</p>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'

onMounted(() => {
  console.log(' component mounted')
})
</script>

<style lang="less"></style>
