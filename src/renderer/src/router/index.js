import { createRouter, createWebHistory } from 'vue-router'
import VueRouter from '../components/VueRouter.vue'
import ProgressBar from '../components/VueRouter/ProgressBar.vue'
import VueTransition from '../components/VueRouter/VueTransition.vue'
import VirtualScroll from '../components/VueRouter/VirtualScroll.vue'
import Table from '../components/VueRouter/Table.vue'

const routes = [
  {
    path: '/',
    name: 'welcome',
    component: () => import('../components/Empty.vue')
  },
  {
    path: '/vueRouterDemo',
    name: 'vue Router',
    component: VueRouter,
    children: [
      {
        path: 'progress-bar',
        name: 'Progress Bar',
        component: ProgressBar
      },
      {
        path: 'vue-transition',
        name: 'Vue Transition',
        component: VueTransition
      },
      {
        path: 'virtual-scroll',
        name: 'Virtual Scroll',
        component: VirtualScroll
      },
      {
        path: 'table',
        name: 'Table',
        component: Table
      }
    ]
  },
  {
    path: '/:p(.*)/index.html',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routes
})

export default router
