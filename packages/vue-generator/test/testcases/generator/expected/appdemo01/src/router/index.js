import { createRouter, createWebHashHistory } from 'vue-router'
const routes = [
  { path: '/', redirect: '/demopage' },
  { path: '/demopage', component: () => import('@/views/DemoPage.vue') },
  { path: '/createVm', component: () => import('@/views/createVm.vue') }
]

export default createRouter({
  history: createWebHashHistory(),
  routes
})
