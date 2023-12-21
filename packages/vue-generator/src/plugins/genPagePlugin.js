import { mergeOptions } from '../utils/mergeOptions'
import { generatePageCode } from '../generator/page'

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

      return {
        id: 'pages',
        result: resPageTree
      }
    },
    transform(transformedSchema) {
      const { pages } = transformedSchema

      const resPage = []

      for (const page of pages) {
        const res = generatePageCode({
          pageInfo: { schema: page, name: page.componentName },
          componentsMap: this.schema.componentsMap
        })

        const { errors, ...restInfo } = res[0]

        if (errors?.length > 0) {
          this.genLogs.push(...errors)
          continue
        }

        const { panelName, panelValue } = restInfo

        resPage.push({
          fileName: panelName,
          path: page.path,
          fileContent: panelValue
        })
      }

      return resPage
    }
  }
}

export default genPagePlugin
