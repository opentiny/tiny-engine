import { CodeGenerator } from '@tinyengine/vue-generator'
import { genTemplatePlugin } from '../plugins/genTemplatePlugin'
import { genBlockPlugin } from '@tinyengine/vue-generator/src/plugins/genBlockPlugin'
import { genPagePlugin } from '../plugins/genPagePlugin'
import { genDataSourcePlugin } from '@tinyengine/vue-generator/src/plugins/genDataSourcePlugin'
import { genDependenciesPlugin } from '../plugins/genDependenciesPlugin'
import { genGlobalState } from '@tinyengine/vue-generator/src/plugins/genGlobalState'
import { genI18nPlugin } from '@tinyengine/vue-generator/src/plugins/genI18nPlugin'
import { genRouterPlugin } from '../plugins/genRouterPlugin'
import { genUtilsPlugin } from '@tinyengine/vue-generator/src/plugins/genUtilsPlugin'
import { formatCodePlugin } from '@tinyengine/vue-generator/src/plugins/formatCodePlugin'
import { parseSchemaPlugin } from '@tinyengine/vue-generator/src/plugins/parseSchemaPlugin'

/**
 * 创建UniApp应用生成器
 * @param {Object} options 配置项
 * @param {Object} options.schema 应用schema
 * @param {Object} options.plugins 插件配置
 * @param {Function} options.plugins.template 模板插件
 * @param {Function} options.plugins.block 区块插件
 * @param {Function} options.plugins.page 页面插件
 * @param {Function} options.plugins.dataSource 数据源插件
 * @param {Function} options.plugins.dependencies 依赖插件
 * @param {Function} options.plugins.globalState 全局状态插件
 * @param {Function} options.plugins.i18n 国际化插件
 * @param {Function} options.plugins.router 路由插件
 * @param {Function} options.plugins.utils 工具插件
 * @param {Function} options.plugins.formatCode 代码格式化插件
 * @param {Function} options.plugins.parseSchema schema解析插件
 * @returns {CodeGenerator} 代码生成器实例
 */
export function generateApp(options = {}) {
  const { schema = {}, plugins = {} } = options

  // 默认插件配置
  const defaultPlugins = {
    template: genTemplatePlugin,
    block: genBlockPlugin,
    page: genPagePlugin,
    dataSource: genDataSourcePlugin,
    dependencies: genDependenciesPlugin,
    globalState: genGlobalState,
    i18n: genI18nPlugin,
    router: genRouterPlugin,
    utils: genUtilsPlugin,
    formatCode: formatCodePlugin,
    parseSchema: parseSchemaPlugin
  }

  // 合并插件配置
  const mergedPlugins = { ...defaultPlugins, ...plugins }

  // 创建代码生成器实例
  const generator = new CodeGenerator({
    plugins: [
      mergedPlugins.parseSchema,
      mergedPlugins.template,
      mergedPlugins.block,
      mergedPlugins.page,
      mergedPlugins.dataSource,
      mergedPlugins.dependencies,
      mergedPlugins.globalState,
      mergedPlugins.i18n,
      mergedPlugins.router,
      mergedPlugins.utils,
      mergedPlugins.formatCode
    ]
  })

  // 执行代码生成
  generator.transform(schema)

  return generator
}