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
      return schema?.dataSource || {}
    },
    transform(schema) {
      const dataSource = this.parseSchema(schema)

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
        fileType: 'json',
        fileName,
        path,
        fileContent: JSON.stringify(data)
      }
    }
  }
}

export default genDataSourcePlugin
