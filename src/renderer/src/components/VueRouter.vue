<template>
  <RouterLink to="/" class="home-click">
    <ion-icon :icon="home" class="panel-icon" />
  </RouterLink>
</template>

<script setup>
import { onMounted } from 'vue'
import { RouterView, RouterLink } from 'vue-router'
import { IonIcon } from '@ionic/vue'
import { home } from 'ionicons/icons'

onMounted(() => {
  console.log(' component mounted')
})
</script>

<style lang="less"></style>
