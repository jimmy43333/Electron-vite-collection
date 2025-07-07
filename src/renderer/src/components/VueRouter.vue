<template>
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
.navigate-sidebar {
  min-width: 200px;
  width: 10%;
  height: 100%;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  padding: 20px;
  background-color: rgba(50, 50, 50);
  box-shadow: inset 0 0 5px rgba(0, 0, 0);
  backdrop-filter: blur(1px);
}

.navigate-item {
  height: 35px;
  align-items: left;
}

.navigate-body {
  position: fixed;
  left: 200px;
  top: 0;
  width: 75%;
  height: 90%;
  margin: 10px;
  padding: 10px;
  box-shadow: inset 0 0 1px rgba(0, 0, 0);
}

a {
  color: aliceblue;
  text-decoration: none;
}

a.router-link-exact-active {
  color: tomato;
}

.touch:hover {
  color: tomato;
}
</style>
