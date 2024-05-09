import { mergeOptions } from '../utils/mergeOptions'

const defaultOption = {
  fileName: 'index.js',
  path: './src/router'
}

const parseSchema = (schema) => {
  const { pageSchema } = schema

  const routes = pageSchema.map(({ meta: { isHome = false, router = '' } = {}, fileName, path }) => ({
    filePath: `@/views${path ? `/${path}` : ''}/${fileName}.vue`,
    fileName,
    isHome,
    path: router?.startsWith?.('/') ? router : `/${router}`
  }))

  const hasRoot = routes.some(({ path }) => path === '/')

  if (!hasRoot && routes.length) {
    const { path: homePath } = routes.find(({ isHome }) => isHome) || { path: routes[0].path }

    routes.unshift({ path: '/', redirect: homePath })
  }

  return routes
}

function genRouterPlugin(options = {}) {
  const realOptions = mergeOptions(defaultOption, options)

  const { path, fileName } = realOptions

  return {
    name: 'tinyEngine-generateCode-plugin-router',
    description: 'transform router schema to router code plugin',
    /**
     * 根据页面生成路由配置
     * @param {tinyEngineDslVue.IAppSchema} schema
     * @returns
     */
    run(schema) {
      const routesList = parseSchema(schema)

      // TODO: 支持 hash 模式、history 模式
      const importSnippet = "import { createRouter, createWebHashHistory } from 'vue-router'"
      const exportSnippet = `
export default createRouter({
  history: createWebHashHistory(),
  routes
})`
      const routes = routesList.map(({ fileName, path, redirect, filePath }) => {
        let pathAttr = `path: '${path}'`
        let redirectAttr = ''
        let componentAttr = ''

        if (redirect) {
          redirectAttr = `redirect: '${redirect}'`
        }

        if (fileName) {
          componentAttr = `component: () => import('${filePath}')`
        }

        const res = [pathAttr, redirectAttr, componentAttr].filter((item) => Boolean(item)).join(',')

        return `{${res}}`
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
