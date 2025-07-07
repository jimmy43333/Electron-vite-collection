<template>
  <transition name="slide-right">
    <div v-if="show_left" class="left-box" @click="show_left = false">
      <h1>Left side box</h1>
    </div>
  </transition>
  <transition name="slide-left">
    <div v-if="show_right" class="right-box" @click="show_right = false">
      <h1>Right side box</h1>
    </div>
  </transition>
  <button @click="show_left = true">Show Left</button>
  <button @click="show_right = true">Show Right</button>
</template>

<script setup>
import { onMounted, ref } from 'vue'
const show_left = ref(false)
const show_right = ref(false)
onMounted(() => {
  console.log('Vue Transition component mounted')
})
</script>

<style lang="less">
.left-box {
  width: 20%;
  height: 100%;
  position: absolute;
  padding: 10px;
  top: 0;
  left: 0;
  background-color: cadetblue;
}

.slide-right-enter-from {
  transform: translateX(-100%);
}

.slide-right-leave-to {
  transform: translateX(-100%);
}

.slide-right-leave-active,
.slide-right-enter-active {
  transition: all 0.3s ease-in;
}

.right-box {
  width: 20%;
  height: 100%;
  position: absolute;
  padding: 10px;
  top: 0;
  right: 0;
  background-color: cadetblue;
}

.slide-left-enter-from {
  transform: translateX(100%);
}

.slide-left-leave-to {
  transform: translateX(100%);
}

.slide-left-leave-active,
.slide-left-enter-active {
  transition: all 0.3s ease-in;
}
</style>
