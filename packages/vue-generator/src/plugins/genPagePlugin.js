import { mergeOptions } from '../utils/mergeOptions'
import { genSFCWithDefaultPlugin } from '../generator'

const defaultOption = {
  pageBasePath: './src/views'
}

function genPagePlugin(options = {}) {
  const realOptions = mergeOptions(defaultOption, options)

  const { pageBasePath } = realOptions

  return {
    name: 'tinyengine-plugin-generatecode-page',
    description: 'transform page schema to code',
    parseSchema(schema) {
      const { componentsTree } = schema
      const pagesMap = {}
      const resPageTree = []

      for (const componentItem of componentsTree) {
        pagesMap[componentItem.id] = componentItem
      }

      for (const componentItem of componentsTree) {
        if (componentItem.componentName === 'Folder') {
          continue
        }

        const newComponentItem = {
          ...componentItem
        }
        let path = pageBasePath
        let curParentId = componentItem.meta.parentId
        let depth = 0

        while (curParentId !== '0' && depth < 1000) {
          const preFolder = pagesMap[curParentId]

          path += `/${preFolder.folderName}`
          curParentId = preFolder.parentId
          depth++
        }

        newComponentItem.path = path

        resPageTree.push(newComponentItem)
      }

      return resPageTree
    },
    transform(schema) {
      const pages = this.parseSchema(schema)

      const resPage = []

      for (const page of pages) {
        const res = genSFCWithDefaultPlugin(page, this.schema.componentsMap)

        resPage.push({
          fileType: 'vue',
          fileName: `${page.componentName}.vue`,
          path: page.path,
          fileContent: res
        })
      }

      return resPage
    }
  }
}

export default genPagePlugin
