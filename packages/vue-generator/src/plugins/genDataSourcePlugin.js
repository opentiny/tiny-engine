import { mergeOptions } from '../utils/mergeOptions'

const defaultOption = {
  fileName: 'dataSource.json',
  path: './src'
}

function genDataSourcePlugin(options = {}) {
  const realOptions = mergeOptions(defaultOption, options)

  const { path, fileName } = realOptions

  return {
    name: 'tinyengine-plugin-generatecode-datasource',
    description: 'transform schema to dataSource plugin',
    parseSchema(schema) {
      return {
        id: 'dataSource',
        result: schema?.dataSource || {}
      }
    },
    transform(transformedSchema) {
      const dataSource = transformedSchema.dataSource

      const { dataHandler, errorHandler, willFetch, list } = dataSource || {}

      const data = {
        list: list.map(({ id, name, data }) => ({ id, name, ...data }))
      }

      if (dataHandler) {
        data.dataHandler = dataHandler
      }

      if (errorHandler) {
        data.errorHandler = errorHandler
      }

      if (willFetch) {
        data.willFetch = willFetch
      }

      return {
        fileName,
        path,
        fileContent: JSON.stringify(data)
      }
    }
  }
}

export default genDataSourcePlugin
