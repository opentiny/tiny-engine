function parseSchema() {
  return {
    name: 'tinyEngine-generateCode-plugin-parse-schema',
    description: 'parse schema, preprocess schema',

    /**
     * 解析schema，预处理 schema
     * @param {import('../generator/generateApp').AppSchema} schema
     * @returns
     */
    run(schema) {
      const { pageSchema } = schema
      const pagesMap = {}
      const resPageTree = []

      for (const componentItem of pageSchema) {
        pagesMap[componentItem.id] = componentItem
      }

      for (const componentItem of pageSchema) {
        if (componentItem.componentName === 'Folder') {
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

          path = `${preFolder.folderName}/${path}`
          curParentId = preFolder.parentId
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
