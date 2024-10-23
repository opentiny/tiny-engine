import { createRouter, createWebHashHistory } from 'vue-router'
const routes = [
  { path: '/', redirect: '/demopage' },
  { path: '/demopage', component: () => import('@/views/DemoPage.vue') }
]

export default createRouter({
  history: createWebHashHistory(),
  routes
})
