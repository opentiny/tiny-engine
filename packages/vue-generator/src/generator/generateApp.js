import { generateTemplate as genDefaultStaticTemplate } from '../templates/vue-template'
import {
  genBlockPlugin,
  genDataSourcePlugin,
  genDependenciesPlugin,
  genI18nPlugin,
  genPagePlugin,
  genRouterPlugin,
  genTemplatePlugin,
  genUtilsPlugin
} from '../plugins'
import CodeGenerator from './codeGenerator'

const inputMock = {
  // 应用相关配置信息
  //config: {},
  // 应用相关的 meta 信息
  appMeta: {},
  // 页面区块信息
  componentsTree: [],
  blockList: [],
  // 数据源信息
  dataSource: [],
  // i18n 信息
  i18n: {},
  // utils 信息
  utils: [],
  // 全局状态
  globalState: []
}

// TODO 解析整个应用用到的区块
// 1. 解析页面中用到的区块
// 2. 解析区块中用到的区块

const transformedSchema = {
  // 整体应用 meta 信息
  appMeta: {
    name: 'test'
  },
  // 需要生成的页面
  pageCode: [
    {
      // 类型是页面
      // type: 'PAGE',
      // 类型是区块
      // type: 'BLOCK',
      // 页面 meta 信息
      meta: {},
      // schema 信息，如果是 文件夹，则不需要
      schema: {}
      // ...
    }
  ],
  dataSource: {},
  i18n: {},
  routes: {},
  utils: {},
  globalState: [
    {
      actions: {},
      getters: {},
      id: '',
      state: {}
    }
  ]
}

// 预处理输入的 schema，转换为标准的格式
function transformSchema(appSchema) {
  const { appMeta, pageCode, dataSource, i18n, utils, globalState } = appSchema

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

  return {
    appMeta,
    pageCode,
    dataSource,
    i18n,
    utils,
    globalState,
    routes
  }
}

/**
 * 整体应用出码
 */
export async function generateApp(appSchema, context = {}) {
  const codeGenInstance = new CodeGenerator({
    plugins: [
      genBlockPlugin(),
      genDataSourcePlugin(),
      genDependenciesPlugin(),
      genI18nPlugin(),
      genPagePlugin(),
      genRouterPlugin(),
      genTemplatePlugin(),
      genUtilsPlugin()
    ],
    context: context || {}
  })

  return codeGenInstance.generate(appSchema)
}
