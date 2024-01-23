import { mergeOptions } from '../utils/mergeOptions'

const defaultOption = {
  fileName: 'index.js',
  path: './src/router'
}

function genRouterPlugin(options = {}) {
  const realOptions = mergeOptions(defaultOption, options)

  const { path, fileName } = realOptions

  return {
    name: 'tinyengine-plugin-generatecode-router',
    description: 'transform router schema to router code plugin',
    parseSchema(schema) {
      const { pageCode } = schema

      const routes = pageCode.map(({ meta: { isHome, router }, fileName }) => ({
        fileName,
        isHome,
        path: router.startsWith('/') ? router : `/${router}`
      }))

      const hasRoot = routes.some(({ path }) => path === '/')

      if (!hasRoot && routes.length) {
        const { path: homePath } = routes.find(({ isHome }) => isHome) || { path: routes[0].path }

        routes.unshift({ path: '/', redirect: homePath })
      }

      return routes
    },
    transform(schema) {
      const { routes: routesList } = this.parseSchema(schema)

      // TODO: 支持 hash 模式、history 模式
      const importSnippet = "import { createRouter, createWebHashHistory } from 'vue-router'"
      const exportSnippet = `
    export default createRouter({
      history: createWebHashHistory(),
      routes
    })
  `
      const routes = routesList.map(({ fileName, path, redirect, filePath }) => {
        const routeItem = {
          path
        }

        if (redirect) {
          routeItem.redirect = redirect
        }

        if (fileName) {
          routeItem.component = `() => import('${filePath}')`
        }

        return JSON.stringify(routeItem)
      })

      const routeSnippets = `const routes = [${routes.join(',')}]`

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
