import { mergeOptions } from '../utils/mergeOptions'

const defaultOption = {
  fileName: 'index.jsx',
  path: './src/router'
}

const parseSchema = (schema) => {
  const { pageSchema } = schema

  const routes = pageSchema.map(({ meta: { isHome = false, router = '' } = {}, fileName, path }) => ({
    filePath: `@/views${path ? `/${path}` : ''}/${fileName}.jsx`,
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
      const importSnippet =
        'import { Routes, Route } from "react-router-dom"\n import { useLazy } from "../hooks/uselazy"'

      const lazyPage = routesList.map(({ fileName, filePath }) => {
        return `
            const ${fileName} = useLazy(import("${filePath}"))
          `
      })

      const routes = routesList.map(({ fileName, path, redirect }) => {
        let pathAttr = `path='${path}'`
        let redirectAttr = ''
        let componentAttr = ''

        if (redirect) {
          redirectAttr = `redirect='${redirect}'`
        }

        if (fileName) {
          componentAttr = `element={${fileName}}`
        }

        const ans = `<Route ${pathAttr} ${componentAttr} ${redirectAttr}></Route>`

        return ans
      })

      const routeSnippets = `<Routes> \n ${routes} \n </Routes>`

      const exportSnippet = `
        export const Routers = () => {
          return (
            ${routeSnippets}
          )  
        }
      `

      const res = {
        fileType: 'jsx',
        fileName,
        path,
        fileContent: `${importSnippet}\n \n ${lazyPage.join('')} \n ${exportSnippet}`
      }

      return res
    }
  }
}

export default genRouterPlugin
