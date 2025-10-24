import { createRouter, createWebHashHistory } from 'vue-router'
import { useAppSchema } from '../composables/useAppSchema'
import type { RouteConfig } from '../types/config'
import type { PageMeta } from '../types/schema'

// 定义页面结构类型
interface PageSchema {
  id: string
  name: string
  route: string
  parentId: string
  isHome: boolean
  isDefault: boolean
  depth: number
  children?: PageSchema[]
  meta: PageMeta
}

// 异步初始化路由配置
async function createRouterConfig() {
  const { pages } = useAppSchema()

  // 生成路由配置
  const generateRoutesConfig = () => {
    if (!pages.value) return []

    // 构建页面映射，方便查找
    const pageMap = new Map<string, PageSchema>()
    pages.value.forEach((page: PageSchema) => {
      pageMap.set(page.id, page)
    })

    // 构建父子关系映射
    const childrenMap = new Map<string, PageSchema[]>()
    pages.value.forEach((page: PageSchema) => {
      if (page.parentId !== '0') {
        if (!childrenMap.has(page.parentId)) {
          childrenMap.set(page.parentId, [])
        }
        childrenMap.get(page.parentId)!.push(page)
      }
    })

    // 递归构建路由配置
    const buildRouteConfig = (page: PageSchema) => {
      const isChildRoute = page.parentId !== '0'

      const routeConfig = {
        path: isChildRoute ? page.route : `/${page.route}`,
        name: `${page.id}`,
        component: async () => (await import('../components/PageRenderer.ts')).default,
        props: { pageId: page.id },
        children: [] as RouteConfig[],
        meta: {
          pageId: page.id,
          pageName: page.name,
          isHome: page.isHome,
          hasChildren: (page.children && page.children.length > 0) || false,
          depth: page.depth,
          isDefault: page.isDefault,
          hasDefault: false,
          defaultPath: ''
        }
      }

      // 递归处理子路由
      const children = childrenMap.get(page.id) || []
      children.forEach((child) => {
        const childRoute = buildRouteConfig(child)
        routeConfig.children.push(childRoute)

        // 处理默认路由
        if (childRoute.meta.isDefault) {
          routeConfig.meta.hasDefault = true
          routeConfig.meta.defaultPath = `${routeConfig.path}/${childRoute.path}`
          routeConfig.redirect = routeConfig.meta.defaultPath
        }
      })

      return routeConfig
    }

    // 只处理根路由（parentId为'0'的路由）
    const rootPages = pages.value.filter((page: PageSchema) => page.parentId === '0')
    const routesConfig = rootPages.map((page) => buildRouteConfig(page))

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
