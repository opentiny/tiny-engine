import { createRouter, createWebHashHistory } from 'vue-router'
const routes = [
  {
    name: '5bhD7p5FUsUOTFRN',
    path: 'demopage',
    component: () => import('@/views/DemoPage.vue'),
    children: []
  },
  {
    name: 'NTJ4MjvqoVj8OVsc',
    path: 'createVm',
    component: () => import('@/views/createVm.vue'),
    children: []
  },
  {
    name: '1737797330916',
    path: 'testCanvasRowCol',
    component: () => import('@/views/testCanvasRowCol.vue'),
    children: []
  }
]

export default createRouter({
  history: createWebHashHistory(),
  routes: [{ path: '/', children: routes }]
})
