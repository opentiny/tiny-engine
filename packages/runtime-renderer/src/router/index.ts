import { createRouter, createWebHashHistory } from 'vue-router'
import { useAppSchema } from '../composables/useAppSchema'
import type { IRouteConfig } from '../types/config'
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

  // 通过pages生成路由配置
  const generateRoutesByPages = (pages: Array<PageSchema>): Array<IRouteConfig> => {
    // 建立路由-页面id映射
    const pageRouteMap = new Map<string, IRouteConfig>()
    pages.forEach((page: PageSchema) => {
      const pageIdStr = String(page.id)
      // JAVA后端中page.id字段为number类型，前端mockServer中为string类型
      // 为了同时兼容JAVA后端和mockserver,显示转换作为键的pageId为字符串
      pageRouteMap.set(pageIdStr, {
        path: `${page.route}`,
        name: pageIdStr,
        component: () => import('../components/PageRenderer.ts'),
        props: { pageId: page.id },
        children: [],
        meta: {
          pageId: pageIdStr,
          parentId: page.parentId,
          pageName: page.name,
          isHome: page.isHome,
          depth: page.depth,
          isDefault: page.isDefault,
          hasDefault: false,
          hasChildren: false,
          defaultPath: ''
        }
      })
    })

    // 建立树状路由关系
    const routeConfs = [] as Array<IRouteConfig>
    let redirectRoute = {} as IRouteConfig
    pageRouteMap.forEach((config, _id) => {
      const pRouteConf = pageRouteMap.get((config?.meta?.parentId || '0') as string)
      if (pRouteConf) {
        // 存在父级路由则添加至父级路由
        pRouteConf.children = [...(pRouteConf?.children || []), config]
        pRouteConf.meta = { ...pRouteConf.meta, hasChildren: true }
        // 处理默认子路由
        if (config?.meta?.isDefault) {
          const parentPath = pRouteConf.path.startsWith('/') ? pRouteConf.path : `/${pRouteConf.path}`
          pRouteConf.redirect = `${parentPath}/${config.path}`.replace(/\/+/g, '/')
          pRouteConf.meta = { ...pRouteConf.meta, hasDefault: true }
        }
      } else {
        // 无父级路由均为根路由
        config.path = `/${config.path}`
        routeConfs.push(config)
      }
      // 处理首页路由
      if (config?.meta?.isHome) {
        const getUrl = (conf: IRouteConfig): string => {
          const parent = pageRouteMap.get((conf?.meta?.parentId || '0') as string)
          return parent && conf ? `${getUrl(parent)}/${conf.path}` : conf ? `/${conf.path.replace(/^\/+/, '')}` : ''
        }
        redirectRoute = { path: '/', redirect: getUrl(config) }
        routeConfs.push(redirectRoute)
      }
    })
    return routeConfs
  }

  const routes = generateRoutesByPages(pages.value)

  routes.push({
    path: '/:pathMatch(.*)*',
    component: () => import('../components/NotFound.vue')
  })

  return routes
}

export async function createAppRouter() {
  const routes = await createRouterConfig()
  const router = createRouter({
    history: createWebHashHistory('/runtime.html'),
    routes
  })
  return router
}
