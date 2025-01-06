import { mergeOptions } from '../utils/mergeOptions'

const defaultOption = {
  fileName: 'index.js',
  path: './src/router'
}

const flattenRoutes = (routes, parentPath = '') => {
  return routes.reduce((acc, route) => {
    const fullPath = `${parentPath}${route.path}`

    if (route.path !== '') {
      if (route.component) {
        // 如果存在 component，则直接添加路由
        const newRoute = {
          name: `${route.name}`,
          path: fullPath,
          component: route.component,
          children: flattenRoutes(route.children)
        }
        const redirectChild = route.children.find((item) => item.isDefault)

        if (route.children && redirectChild) {
          newRoute.redirect = { name: `${redirectChild.name}` }
        }

        acc.push(newRoute)
      } else if (route.children && route.children.length > 0) {
        // 如果不存在 component 但有 children，则递归处理 children
        const children = flattenRoutes(route.children, fullPath + '/')
        // 将处理后的 children 合并到上一层存在 component 的路由中
        acc.push(...children)
      }
      // 如果既没有 component 也没有 children，则不做任何处理
    } else {
      acc.push(route)
    }

    return acc
  }, [])
}

const convertToNestedRoutes = (schema) => {
  const pageSchema = schema.pageSchema?.sort((a, b) => a.meta?.router?.length - b.meta?.router?.length)
  const result = []
  let home = {}
  let isGetHome = false

  pageSchema.forEach((item) => {
    if ((item.meta.isHome || item.meta.isDefault) && !isGetHome) {
      home = {
        path: '',
        redirect: { name: `${item.meta.id}` }
      }
      isGetHome = true
    }

    const parts = item.meta?.router?.split('/').filter(Boolean)
    let curretnLevel = result

    parts.forEach((part, index) => {
      let found = false

      for (let i = 0; i < curretnLevel.length; i++) {
        if (curretnLevel[i].path === part) {
          // 如果已经存在该路径部分，则进入下一层级
          curretnLevel = curretnLevel[i].children
          found = true
          break
        }
      }

      if (!found) {
        // 如果不存在该路径部分，创建一个新节点
        const newNode = {
          path: part,
          children: []
        }
        // 如果路径是最后一步，则设置组件和属性
        if (index === parts.length - 1) {
          newNode.component = `() => import('@/views${item.path ? `/${item.path}` : ''}/${item.fileName}.vue')`
          newNode.isDefault = item.meta.isDefault
          newNode.name = item.meta.id
        }

        curretnLevel.push(newNode)
        curretnLevel = newNode.children
      }
    })
  })

  if (home.redirect) {
    result.unshift(home)
  }

  return flattenRoutes(result)
}

// 示例路由数组
function genRouterPlugin(options = {}) {
  const realOptions = mergeOptions(defaultOption, options)
  const { path, fileName } = realOptions

  return {
    name: 'tinyEngine-generateCode-plugin-router',
    description: 'transform router schema to router code plugin',
    /**
     * 根据页面生成路由配置
     * @param {import('@opentiny/tiny-engine-dsl-vue').IAppSchema} schema
     * @returns
     */
    run(schema) {
      const routesList = convertToNestedRoutes(schema)
      const resultStr = JSON.stringify(routesList, null, 2).replace(
        /("component":\s*)"(.*?)"/g,
        (match, p1, p2) => p1 + p2
      )

      // TODO: 支持 hash 模式、history 模式
      const importSnippet = "import { createRouter, createWebHashHistory } from 'vue-router'"
      const exportSnippet = `
      export default createRouter({
        history: createWebHashHistory(),
        routes
      })`

      const routeSnippets = `const routes = ${resultStr}`

      const res = {
        fileType: 'js',
        fileName,
        path,
        fileContent: `${importSnippet}\n ${routeSnippets} \n ${exportSnippet}`
      }

      return res
    }
  }
}

export default genRouterPlugin
