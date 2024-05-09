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
     * @param {tinyEngineDslVue.IAppSchema} schema
     * @returns
     */
    run(schema) {
      const pages = schema.pageSchema

      const resPage = []

      for (const page of pages) {
        const res = genSFCWithDefaultPlugin(page, schema.componentsMap, sfcConfig)

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
