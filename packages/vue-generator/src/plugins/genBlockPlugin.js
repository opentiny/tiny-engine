import { mergeOptions } from '../utils/mergeOptions'
import { genSFCWithDefaultPlugin } from '../generator'

const defaultOption = {
  blockBasePath: './src/components'
}

function genBlockPlugin(options = {}) {
  const realOptions = mergeOptions(defaultOption, options)

  const { blockBasePath } = realOptions

  return {
    name: 'tinyengine-plugin-generatecode-block',
    description: 'transform block schema to code',
    parseSchema(schema) {
      const { blockHistories } = schema
      const blockSchema = blockHistories.map((block) => block?.content).filter((schema) => typeof schema === 'object')

      return blockSchema
    },
    transform(schema) {
      const blocks = this.parseSchema(schema)

      const resBlocks = []

      for (const block of blocks) {
        const res = genSFCWithDefaultPlugin(block, this.schema.componentsMap, { blockRelativePath: './' })

        resBlocks.push({
          fileType: 'vue',
          fileName: `${block.componentName}.vue`,
          path: blockBasePath,
          fileContent: res
        })
      }

      return resBlocks
    }
  }
}

export default genBlockPlugin
