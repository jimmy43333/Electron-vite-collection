<template>
  <div class="empty-content">
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

<style lang="less"></style>
