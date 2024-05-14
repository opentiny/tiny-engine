import { mergeOptions } from '../utils/mergeOptions'

const defaultOption = {
  fileName: 'dataSource.json',
  path: './src/lowcodeConfig'
}

function genDataSourcePlugin(options = {}) {
  const realOptions = mergeOptions(defaultOption, options)

  const { path, fileName } = realOptions

  return {
    name: 'tinyEngine-generateCode-plugin-dataSource',
    description: 'transform schema to dataSource plugin',
    /**
     * 转换 dataSource
     * @param {tinyEngineDslVue.IAppSchema} schema
     * @returns
     */
    run(schema) {
      const dataSource = schema?.dataSource || {}

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
