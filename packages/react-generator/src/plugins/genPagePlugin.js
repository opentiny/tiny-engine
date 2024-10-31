import { mergeOptions } from '../utils/mergeOptions'
import { generateCode } from '../generator'
// import { genSFCWithDefaultPlugin } from '../generator'

const defaultOption = {
  pageBasePath: './src/views'
}

function genPagePlugin(options = {}) {
  const realOptions = mergeOptions(defaultOption, options)

  const { pageBasePath } = realOptions

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

      pages.forEach((item) => {
        const fileName = item.fileName
        const eachData = item.eachData
        eachData.forEach((item) => {
          resPage.push({
            fileType: item.panelType === 'css' ? 'css' : 'jsx',
            fileName: `${item.panelName}`,
            path: `${pageBasePath}/${fileName}`,
            fileContent: item.panelValue
          })
        })
      })
      return resPage
    }
  }
}

export default genPagePlugin
