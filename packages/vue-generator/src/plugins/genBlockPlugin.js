import { mergeOptions } from '../utils/mergeOptions'
import { genSFCWithDefaultPlugin } from '../generator'

const defaultOption = {
  blockBasePath: './src/components'
}

function genBlockPlugin(options = {}) {
  const realOptions = mergeOptions(defaultOption, options)

  const { blockBasePath, sfcConfig = {} } = realOptions

  return {
    name: 'tinyEngine-generateCode-plugin-block',
    description: 'transform block schema to code',
    /**
     * 将区块 schema 转换成高代码
     * @param {import('@opentiny/tiny-engine-dsl-vue').IAppSchema} schema
     * @returns
     */
    run(schema, context) {
      const blocks = schema?.blockSchema || []
      const componentsMap = schema?.componentsMap

      if (blocks && !Array.isArray(blocks)) {
        throw new Error(`[codeGenerate][plugins] blockSchema should be array, but actually receive ${typeof blocks}`)
      }

      const resBlocks = []

      // 从上下文中获取 MCP 配置
      const mcpEnabled = context?.pluginConfig?.mcp?.enabled || false

      for (const block of blocks) {
        // 将 MCP 配置传递给 SFC 生成器
        const res = genSFCWithDefaultPlugin(block, componentsMap, {
          blockRelativePath: './',
          ...sfcConfig,
          mcpEnabled
        })

        resBlocks.push({
          fileType: 'vue',
          fileName: `${block.fileName}.vue`,
          path: blockBasePath,
          fileContent: res
        })
      }

      return resBlocks
    }
  }
}

export default genBlockPlugin
