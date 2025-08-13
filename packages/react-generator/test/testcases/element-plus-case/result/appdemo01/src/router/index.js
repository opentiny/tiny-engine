import { createRouter, createWebHashHistory } from 'vue-router'
const routes = [
  {
    path: '/',
    children: [
      {
        name: '5bhD7p5FUsUOTFRN',
        path: 'demopage',
        component: () => import('@/views/DemoPage.vue'),
        children: []
      }
    ]
  }
]

export default createRouter({
  history: createWebHashHistory(),
  routes
})
