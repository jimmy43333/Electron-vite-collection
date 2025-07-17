<template>
  <div class="navigate-container">
    <div class="navigate-sidebar">
      <div v-for="ele in items_list" :key="ele.router" class="navigate-item">
        <RouterLink class="tip touch" :to="ele.router" @click="show_side_bar = false">{{
          ele['name']
        }}</RouterLink>
      </div>
    </div>
    <div class="navigate-body">
      <RouterView v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" :key="$route.path" />
        </keep-alive>
      </RouterView>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { RouterView, RouterLink, useRouter } from 'vue-router'
const router = useRouter()
const items_list = ref([])
onMounted(() => {
  console.log('VueRouter component mounted')
  const parentRoute = router.getRoutes().find((route) => route.path === '/vueRouterDemo')
  // If found, use its children as the list
  if (parentRoute && parentRoute.children) {
    items_list.value = parentRoute.children.map((child) => ({
      name: child.name,
      router: '/vueRouterDemo/' + child.path // ensure full path
    }))
  } else {
    items_list.value = []
  }
})
</script>

<style lang="less">
.navigate-container {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: row;
}

.navigate-sidebar {
  width: 200px;
  height: 100vh;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  padding: 20px;
  background-color: rgba(50, 50, 50);
  box-shadow: inset 0 0 5px rgba(0, 0, 0);
  backdrop-filter: blur(1px);
}

.navigate-body {
  flex: 1;
  height: 90%;
  margin: 10px;
  padding: 10px;
  overflow: auto;
  box-sizing: border-box;
  box-shadow: inset 0 0 1px rgba(0, 0, 0);
}

.navigate-item {
  height: 35px;
  align-items: left;
}

a {
  color: aliceblue;
  text-decoration: none;
}

a.router-link-exact-active {
  background: linear-gradient(315deg, #42d392 25%, #647eff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.touch:hover {
  color: #647eff;
}
</style>
