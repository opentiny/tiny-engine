import { createRouter, createWebHashHistory } from 'vue-router'
const routes = [
  {
    path: '/',
    children: [
      {
        name: '1',
        path: 'CreateVm',
        component: () => import('@/views/createVm.vue'),
        children: []
      },
      {
        name: '1GhxcwoNeestd4aI',
        path: 'Demopage',
        component: () => import('@/views/DemoPage.vue'),
        children: []
      },
      {
        name: 'MQSQpz7noWlTRnse',
        path: 'Lifecycle',
        component: () => import('@/views/LifeCyclePage.vue'),
        children: []
      },
      {
        name: 'mPX398RIysZI3CRG',
        path: 'UntitledA',
        component: () => import('@/views/UntitledA.vue'),
        children: []
      }
    ]
  }
]

export default createRouter({
  history: createWebHashHistory(),
  routes
})
