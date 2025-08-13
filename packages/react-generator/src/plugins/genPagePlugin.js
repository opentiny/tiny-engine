import { mergeOptions } from '../utils/mergeOptions'
import { generatePageCode } from '../generator/page'

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
     * @param {tinyEngineDslReact.IAppSchema} schema
     * @returns
     */
    run(schema) {
      const pages = schema.pageSchema
      const componentsMap = schema.componentsMap || []

      const resPage = []

      pages.forEach((pageSchema) => {
        const fileName = pageSchema.fileName
        const pageInfo = { 
          schema: pageSchema, 
          name: fileName 
        }
        
        // 使用 generatePageCode 生成页面代码
        const pagePanels = generatePageCode({ 
          pageInfo, 
          componentsMap, 
          isEntry: true 
        })

        // 将面板数据转换为插件期望的格式
        pagePanels.forEach((panel) => {
          resPage.push({
            fileType: panel.panelType === 'css' ? 'css' : 'jsx',
            fileName: panel.panelName,
            path: `${pageBasePath}/${fileName}`,
            fileContent: panel.panelValue
          })
        })
      })
      
      return resPage
    }
  }
}

export default genPagePlugin
