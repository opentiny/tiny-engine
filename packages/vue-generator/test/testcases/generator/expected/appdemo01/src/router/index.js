import { createRouter, createWebHashHistory } from 'vue-router'
const routes = [
  {
    path: '/',
    redirect: {
      name: 'NTJ4MjvqoVj8OVsc'
    },
    children: [
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
        children: [
          {
            name: '3sV9KkvL3SuQIufS',
            path: 'untitledFA/UntitledA',
            component: () => import('@/views/createVm/untitledFA/UntitledA.vue'),
            children: []
          }
        ],
        redirect: {
          name: '3sV9KkvL3SuQIufS'
        }
      },
      {
        name: '1737797330916',
        path: 'testCanvasRowCol',
        component: () => import('@/views/testCanvasRowCol.vue'),
        children: []
      }
    ]
  }
]

export default createRouter({
  history: createWebHashHistory(),
  routes
})
