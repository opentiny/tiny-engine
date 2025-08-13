import { mergeOptions } from '../utils/mergeOptions'
// import { genSFCWithDefaultPlugin } from '../generator'

const defaultOption = {
  blockBasePath: './src/components'
}

function genBlockPlugin(options = {}) {
  const realOptions = mergeOptions(defaultOption, options)

  const { blockBasePath } = realOptions

  return {
    name: 'tinyEngine-generateCode-plugin-block',
    description: 'transform block schema to code',
    /**
     * 将区块 schema 转换成高代码
     * @param {tinyEngineDslReact.IAppSchema} schema
     * @returns
     */
    run(schema) {
      const blocks = schema?.blockSchema || []

      if (blocks && !Array.isArray(blocks)) {
        throw new Error(`[codeGenerate][plugins] blockSchema should be array, but actually receive ${typeof blocks}`)
      }

      const resBlocks = []

      for (const block of blocks) {
        resBlocks.push({
          fileType: 'jsx',
          fileName: `${block.fileName}.jsx`,
          path: blockBasePath,
          fileContent: 'wujiayu'
        })
      }

      return resBlocks
    }
  }
}

export default genBlockPlugin
