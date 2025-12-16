/**
 * Copyright (c) 2023 - present TinyEngine Authors.
 * Copyright (c) 2023 - present Huawei Cloud Computing Technologies Co., Ltd.
 *
 * Use of this source code is governed by an MIT-style license.
 *
 * THE OPEN SOURCE SOFTWARE IN THIS PRODUCT IS DISTRIBUTED IN THE HOPE THAT IT WILL BE USEFUL,
 * BUT WITHOUT ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS FOR
 * A PARTICULAR PURPOSE. SEE THE APPLICABLE LICENSES FOR MORE DETAILS.
 *
 */

import { createRouter, createWebHistory } from 'vue-router';

const defaultRoutes = [
  {
    path: '/login',
    name: 'Home',
    component: () => import('./login/Index.vue')
  },
  {
    path: '/design',
    name: 'Design',
    component: () => import('./Index.vue')
  }
]

export const initRouter = (routes = defaultRoutes) => {
  const router = createRouter({
    history: createWebHistory(),
    routes
  });

  // 路由守卫示例
  router.beforeEach((to, from, next) => {
    console.log(`Navigating to ${to.path}`);
    const token = localStorage.getItem('engineToken');
    if (to.meta.requiresAuth && !token) {
      next('/login');
    } else {
      next();
    }
  });
  

  return router;
};
