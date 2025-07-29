import { createRouter, createWebHistory } from 'vue-router'
import VueRouter from '../components/VueRouter.vue'
import ProgressBar from '../components/VueRouter/ProgressBar.vue'
import VueTransition from '../components/VueRouter/VueTransition.vue'
import VirtualScroll from '../components/VueRouter/VirtualScroll.vue'
import Table from '../components/VueRouter/Table.vue'
import Terminal from '../components/Terminal.vue'
import SaveJson from '../components/SaveJson.vue'
import VueFlow from '../components/VueFlow.vue'
import Websocket from '../components/Websocket.vue'
import VueDraggable from '../components/VueDraggable.vue'
import RunPython from '../components/RunPython.vue'
import ToastifyBlock from '../components/VueRouter/ToastifyBlock.vue'

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
      },
      {
        path: 'toastify',
        name: 'Toastify',
        component: ToastifyBlock
      }
    ]
  },
  {
    path: '/terminal',
    name: 'Terminal',
    component: Terminal
  },
  {
    path: '/saveJson',
    name: 'Electron Json Storage',
    component: SaveJson
  },
  {
    path: '/vueFlow',
    name: 'Vue Flow',
    component: VueFlow
  },
  {
    path: '/webSocket',
    name: 'Websocket',
    component: Websocket
  },
  {
    path: '/vueDraggable',
    name: 'Vue Draggable',
    component: VueDraggable
  },
  {
    path: '/runPython',
    name: 'Run Python',
    component: RunPython
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
