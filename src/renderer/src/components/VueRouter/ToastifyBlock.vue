<template>
  <div class="toastify-content">
    <button @click="show_alert">Show</button>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import Toastify from 'toastify-js'

const MAX_TOASTS = 3
const activeToasts = ref(0)

function show_alert() {
  if (activeToasts.value >= MAX_TOASTS) {
    console.log('Maximum toast limit reached')
    return
  }
  let dismissed = false
  let message = `Toastify alert shown: ${activeToasts.value + 1} times`
  let toastInstance = Toastify({
    text: message,
    duration: 5000,
    gravity: 'top',
    position: 'right',
    style: {
      'max-width': '100px',
      'font-weight': 'bold',
      color: 'azure',
      background: '#7e000081'
    },
    onClick: function () {
      if (toastInstance) {
        toastInstance.hideToast()
      }
    },
    callback: function () {
      if (!dismissed) {
        activeToasts.value--
        dismissed = true
        console.log(`Toast closed: ${activeToasts.value}`)
      }
    }
  })
  activeToasts.value++
  toastInstance.showToast()
}

onMounted(() => {
  console.log('Toastify component mounted')
})
</script>

<style lang="less">
.toastify-content {
  padding: 50px;
  max-width:;
}
</style>
