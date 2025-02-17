import {
  genBlockPlugin,
  genDataSourcePlugin,
  genDependenciesPlugin,
  genI18nPlugin,
  genPagePlugin,
  genRouterPlugin,
  genTemplatePlugin,
  genUtilsPlugin,
  formatCodePlugin,
  parseSchemaPlugin,
  genGlobalState,
  appendElePlusStylePlugin,
  addIconAssetsPlugin
} from '../plugins'
import CodeGenerator from './codeGenerator'

/**
 * 整体应用出码
 * @param {import('@opentiny/tiny-engine-dsl-vue').IConfig} config
 * @returns {import('@opentiny/tiny-engine-dsl-vue').codeGenInstance}
 */

export function generateApp(config = {}) {
  const defaultPlugins = {
    template: genTemplatePlugin(config.pluginConfig?.template || {}),
    block: genBlockPlugin(config.pluginConfig?.block || {}),
    page: genPagePlugin(config.pluginConfig?.page || {}),
    dataSource: genDataSourcePlugin(config.pluginConfig?.dataSource || {}),
    dependencies: genDependenciesPlugin(config.pluginConfig?.dependencies || {}),
    globalState: genGlobalState(config.pluginConfig?.globalState || {}),
    i18n: genI18nPlugin(config.pluginConfig?.i18n || {}),
    router: genRouterPlugin(config.pluginConfig?.router || {}),
    utils: genUtilsPlugin(config.pluginConfig?.utils || {}),
    formatCode: formatCodePlugin(config.pluginConfig?.formatCode || {}),
    parseSchema: parseSchemaPlugin(config.pluginConfig?.parseSchema || {})
  }

  const { customPlugins = {} } = config
  const {
    template,
    block,
    page,
    dataSource,
    dependencies,
    i18n,
    router,
    utils,
    formatCode,
    parseSchema,
    globalState,
    transformStart = [],
    transform = [],
    transformEnd = []
  } = customPlugins
  const mergeWithDefaultPlugin = {
    template: template || defaultPlugins.template,
    block: block || defaultPlugins.block,
    page: page || defaultPlugins.page,
    dataSource: dataSource || defaultPlugins.dataSource,
    dependencies: dependencies || defaultPlugins.dependencies,
    i18n: i18n || defaultPlugins.i18n,
    router: router || defaultPlugins.router,
    utils: utils || defaultPlugins.utils,
    globalState: globalState || defaultPlugins.globalState
  }

  // 默认支持 element-plus 注入样式
  if (config?.customContext?.injectElementPlusStyle !== false) {
    transformEnd.push(appendElePlusStylePlugin(config?.customContext?.injectElementPlusStyle || {}))
  }

  if (config?.customContext?.useIconifyIcon !== false) {
    transform.push(addIconAssetsPlugin())
  }

  const codeGenInstance = new CodeGenerator({
    plugins: {
      transformStart: [parseSchema || defaultPlugins.parseSchema, ...transformStart],
      transform: [...Object.values(mergeWithDefaultPlugin), ...transform],
      transformEnd: [formatCode || defaultPlugins.formatCode, ...transformEnd]
    },
    context: config?.customContext || {}
  })

  return codeGenInstance
}
