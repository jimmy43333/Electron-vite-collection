<template>
  <div class="websocket-outbox">
    <h2>Websocket chat room</h2>
    <div class="chat-box">
      <div class="chat-user">
        <p>This is User 1</p>
      </div>
      <div class="chat-user">
        <p>This is User 2</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'

onMounted(() => {
  console.log(' component mounted')
})
</script>

<style lang="less">
.websocket-outbox {
  width: 100%;
  height: 100%;
  padding: 50px;
  overflow: auto;
}

.chat-box {
  width: 100%;
  padding: 5px;
  background-color: rgba(aliceblue, 0.1);
  display: flex;
  justify-content: center;
}

.chat-user {
  width: 50%;
  height: 300px;
  margin: 10px;
  background-color: rgba(aquamarine, 0.1);
}
</style>
