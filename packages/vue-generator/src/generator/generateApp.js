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
  genGlobalState
} from '../plugins'
import CodeGenerator from './codeGenerator'

/**
 * @typedef {Object} FuncType
 * @property {String} type
 * @property {String} value
 */

/**
 * @typedef {Object} DataSource
 * @property {Array.<{ id: Number, name: String, data: Object }>} list
 * @property {FuncType} [dataHandler]
 * @property {FuncType} [errorHandler]
 * @property {FuncType} [willFetch]
 */

/**
 * @typedef {Object} GlobalStateItem
 * @property {String} id
 * @property {Object<String, any>} state
 * @property {Object.<String, Object.<{ type: "JSFunction", value: String }>>} actions
 * @property {Object.<String, Object.<{ type: "JSFunction", value: String }>>} getters
 */

/**
 * @typedef {Object} SchemaChildrenItem
 * @property {SchemaChildrenItem} children
 * @property {String} componentName
 * @property {String} id
 * @property {Object.<String, any>} props
 */

/**
 * @typedef {Object} PageOrBlockSchema
 * @property {String} componentName
 * @property {String} css
 * @property {String} fileName
 * @property {Object.<String, Object.<String, { type: "JSFunction", value: String }>>} lifeCycles
 * @property {Object.<String, { type: "JSFunction", value: String }>} methods
 * @property {Object<String, any>} props
 * @property {Array<Object.<String, any>>} state
 * @property {{ id: Number, isHome: Boolean, parentId: String, rootElement: String, route: String }} meta
 * @property {Array.<SchemaChildrenItem>} children
 * @property {{ properties: Array<Object.<String, any>>, events: Object.<String> }} [schema]
 */

/**
 * @typedef {Object} FolderItem
 * @property {String} componentName
 * @property {Number} depth
 * @property {String} folderName
 * @property {Number} id
 * @property {String} parentId
 * @property {String} router
 */

/**
 * @typedef {Object} ComponentMapItem
 * @property {String} componentName
 * @property {Boolean} destructuring
 * @property {String} [exportName]
 * @property {String} [package]
 * @property {String} [main]
 * @property {String} version
 */

/**
 * @typedef {Object} MetaInfo 应用APP 元信息
 * @property {String} name
 * @property {String} description
 */

/**
 * @typedef {Object} AppSchema
 * @property {{en_US: Object.<string, string>, zh_CN: Object.<string, string>}} i18n 国际化数据
 * @property {Array} bridge 桥接源
 * @property {Array.<{ name: String, type: 'npm' | 'function', content: Object }>} utils 工具类
 * @property {DataSource} dataSource 数据源
 * @property {Array<GlobalStateItem>} globalState 全局状态
 * @property {Array.<PageOrBlockSchema | FolderItem>} pageSchema 页面 schema
 * @property {Array.<PageOrBlockSchema>} blockSchema 区块 schema
 * @property {Array.<ComponentMapItem>} componentsMap 物料 package 信息
 * @property {MetaInfo} meta 应用元信息
 */

/**
 * @typedef PluginConfig
 * @property {Object.<string, any>} [template]
 * @property {Object.<string, any>} [block]
 * @property {Object.<string, any>} [page]
 * @property {Object.<string, any>} [dataSource]
 * @property {Object.<string, any>} [dependencies]
 * @property {Object.<string, any>} [i18n]
 * @property {Object.<string, any>} [router]
 * @property {Object.<string, any>} [utils]
 */

/**
 * @typedef {Object} GenerateAppOptions
 * @property {Object.<String, any>} customPlugins
 * @property {Object.<String, any>} customContext
 * @property {PluginConfig} pluginConfig
 * @property {Boolean} tolerateError
 */

/**
 * 整体应用出码
 * @param {GenerateAppOptions} config
 * @param {Object.<string, any>} context
 * @returns {Promise<String>}
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
