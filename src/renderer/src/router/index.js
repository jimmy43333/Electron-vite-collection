import { createRouter, createWebHistory } from 'vue-router'
import VueRouter from '../components/VueRouter.vue'

const routes = [
  {
    path: '/',
    name: 'welcome',
    component: () => import('../components/Empty.vue')
  },
  {
    path: '/vue-router',
    name: 'vue-router',
    component: VueRouter
  },
  //   {
  //     path: '/navigate',
  //     name: 'navigate',
  //     component: () => import('../views/NavigateView.vue'),
  //     children: [
  //       {
  //         path: 'usb_info',
  //         component: () => import('../views/USBinfoView.vue')
  //       }
  //     ]
  //   },
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
