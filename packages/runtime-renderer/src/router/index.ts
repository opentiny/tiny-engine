import { createRouter, createWebHashHistory } from 'vue-router'
import { useAppSchema } from '../composables/useAppSchema'
import type { RouteConfig } from '../types/config'
import { reactive } from 'vue'
// 异步初始化路由配置
async function createRouterConfig() {
  const { pages } = useAppSchema()

  // 生成路由配置
  const generateRoutesConfig = () => {
    if (!pages.value) return []

    const routesConfig = reactive<RouteConfig[]>([])

    // 遍历页面列表生成路由配置
    pages.value.forEach((page) => {
      const isChildRoute = page.parentId !== '0'

      const routeConfigCurrent = {
        path: isChildRoute ? page.route : `/${page.route}`,
        name: `${page.id}`,
        component: async () => (await import('../components/PageRenderer.ts')).default, // 懒加载，避免过早引入RenderMain
        props: { pageId: page.id }, // 静态对象，避免路由嵌套时被覆盖
        children: [],
        meta: {
          pageId: page.id,
          pageName: page.name,
          isHome: page.isHome,
          hasChildren: (page.children && page.children.length > 0) || false,
          depth: page.depth, // 疑问：在嵌套路由中此属性没有改变，此属性和面包屑有关吗？
          isDefault: page.isDefault, // 用于嵌套路由的默认子路由
          hasDefault: false,
          defaultPath: '' // 默认子路由的路径
        }
      }

      if (isChildRoute) {
        const parentId = parseInt(page.parentId, 10)
        const parentRoute = routesConfig.find((r) => r.meta?.pageId === parentId)
        if (parentRoute) {
          parentRoute.children = parentRoute.children || []
          parentRoute.children.push(routeConfigCurrent)
          parentRoute.meta.hasChildren = true
          if (routeConfigCurrent.meta.isDefault) {
            parentRoute.meta.hasDefault = true
            parentRoute.meta.defaultPath = `${parentRoute.path}/${routeConfigCurrent.path}`
            parentRoute.redirect = parentRoute.meta.defaultPath
          }
          return
        } else {
          // eslint-disable-next-line no-console
          console.error(`父路由未找到: 页面 "${page.name}" (ID: ${page.id}) 引用的父路由 ID ${parentId} 不存在`)
          // 将孤立的子路由作为顶级路由添加,确保其仍可访问
          routeConfigCurrent.path = `/${page.router}`
          routesConfig.push(routeConfigCurrent)
        }
      } else {
        routesConfig.push(routeConfigCurrent)
      }
    })

    return routesConfig
  }

  const routes: any[] = []
  const routesConfig = generateRoutesConfig()

  routesConfig.forEach((page) => {
    routes.push(page)
    if (page.meta.isHome) {
      routes.push({ path: '/', redirect: `${page.path}` })
    }
  })

  routes.push({
    path: '/:pathMatch(.*)*',
    component: () => import('../components/NotFound.vue')
  })

  return routes
}

export async function createAppRouter() {
  const routes = await createRouterConfig()
  const router = createRouter({ history: createWebHashHistory('/runtime.html'), routes })

  if (typeof window !== 'undefined') {
    window.__DEBUG_ROUTER__ = router
    // eslint-disable-next-line no-console
    console.log(
      '所有路由:',
      router.getRoutes().map((r) => ({ path: r.path, name: r.name, redirect: r.redirect }))
    )
  }
  return router
}
