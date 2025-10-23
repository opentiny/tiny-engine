import { mergeOptions } from '../utils/mergeOptions'
import { genSFCWithDefaultPlugin } from '../generator'

const defaultOption = {
  pageBasePath: './src/views'
}

function genPagePlugin(options = {}) {
  const realOptions = mergeOptions(defaultOption, options)

  const { pageBasePath, sfcConfig = {} } = realOptions

  return {
    name: 'tinyEngine-generateCode-plugin-page',
    description: 'transform page schema to code',
    /**
     * 将页面 schema 转换成高代码
     * @param {import('@opentiny/tiny-engine-dsl-vue').IAppSchema} schema
     * @returns
     */
    run(schema, context) {
      const pages = schema.pageSchema

      const resPage = []

      // 从上下文中获取 MCP 配置
      const mcpEnabled = context?.pluginConfig?.mcp?.enabled || false

      for (const page of pages) {
        // 将 MCP 配置传递给 SFC 生成器
        const res = genSFCWithDefaultPlugin(page, schema.componentsMap, {
          ...sfcConfig,
          mcpEnabled
        })

        resPage.push({
          fileType: 'vue',
          fileName: `${page.fileName}.vue`,
          path: `${pageBasePath}/${page.path || ''}`,
          fileContent: res
        })
      }

      return resPage
    }
  }
}

export default genPagePlugin
