import { BUILTIN_COMPONENTS_MAP } from '@/constant'

function parseSchema() {
  return {
    name: 'tinyEngine-generateCode-plugin-parse-schema',
    description: 'parse schema, preprocess schema',

    /**
     * 解析schema，预处理 schema
     * @param {tinyEngineDslVue.IAppSchema} schema
     * @returns
     */
    run(schema) {
      const { pageSchema } = schema
      const pagesMap = {}
      const resPageTree = []
      schema.componentsMap = [...schema.componentsMap, ...BUILTIN_COMPONENTS_MAP]

      for (const componentItem of pageSchema) {
        pagesMap[componentItem.meta.id] = componentItem
      }

      for (const componentItem of pageSchema) {
        if (!componentItem.meta.isPage) {
          continue
        }

        const newComponentItem = {
          ...componentItem
        }
        let path = ''
        let curParentId = componentItem.meta.parentId
        let depth = 0

        while (curParentId !== '0' && depth < 1000) {
          const preFolder = pagesMap[curParentId]

          path = `${preFolder.meta.name}${path ? '/' : ''}${path}`
          newComponentItem.meta.router = `${preFolder.meta.router}/${newComponentItem.meta.router}`
          curParentId = preFolder.meta.parentId
          depth++
        }

        newComponentItem.path = path

        resPageTree.push(newComponentItem)
      }

      schema.pageSchema = resPageTree
    }
  }
}

export default parseSchema
