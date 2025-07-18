<template>
  <div class="vue-flow-box">
    <h2>One Point Node</h2>
    <button @click="changeConnect">Change</button>
    <div class="one-point-box">
      <OnePointPanel ref="changeFlow" />
    </div>
    <h2>Four Point Node</h2>
    <div class="four-point-box">
      <EightPointPanel />
    </div>
    <h2>Ten Point Node</h2>
    <div class="ten-point-box">
      <TenPointPanel />
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import OnePointPanel from './VueFlow/Panel_OnePoint.vue'
import EightPointPanel from './VueFlow/Panel_EightPoint.vue'
import TenPointPanel from './VueFlow/Panel_TwelvePoint.vue'
const changeFlow = ref(null)

function changeConnect() {
  if (changeFlow.value) {
    changeFlow.value.change()
  }
}

onMounted(() => {
  console.log(' component mounted')
})
</script>

<style lang="less">
.vue-flow-box {
  width: 100%;
  height: 100%;
  padding: 50px;
  overflow-y: scroll;
}

.one-point-box {
  width: 180px;
  height: 180px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 10px auto;
}

.four-point-box {
  width: 600px;
  height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 10px auto;
}

.ten-point-box {
  width: 600px;
  height: 400px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 10px auto;
}
</style>
