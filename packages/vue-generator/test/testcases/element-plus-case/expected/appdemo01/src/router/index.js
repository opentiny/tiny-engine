import { createRouter, createWebHashHistory } from 'vue-router'
const routes = [
  {
    name: '5bhD7p5FUsUOTFRN',
    path: 'demopage',
    component: () => import('@/views/DemoPage.vue'),
    children: []
  }
]

export default createRouter({
  history: createWebHashHistory(),
  routes: [{ path: '/', children: routes }]
})
