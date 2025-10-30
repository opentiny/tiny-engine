import { createRouter, createWebHistory } from 'vue-router';
import MaterialManagement from '../views/MaterialManagement.vue';

const routes = [
  {
    path: '/',
    name: 'MaterialManagement',
    component: MaterialManagement,
  },
];

// 移除process.env的引用，使用默认配置或显式指定基础路径
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL), // 使用Vite支持的环境变量方式
  // 或者直接使用空值，采用默认配置
  // history: createWebHistory(),
  routes,
});

export default router;
