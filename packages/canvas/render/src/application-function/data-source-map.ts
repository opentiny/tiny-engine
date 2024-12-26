import { shallowReactive } from 'vue'

export interface IDataSourceResult {
  code: string
  msg: string
  data: any
}

export interface IDataSource {
  load?: () => Promise<IDataSourceResult>
  config?: {
    type: string
    data: any
    total?: number
  }
}

export interface IDataSourceMap {
  value?: Record<string, IDataSource>
}

export function useDataSourceMap() {
  const dataSourceMap = shallowReactive<IDataSourceMap>({})

  const getDataSourceMap = () => {
    return dataSourceMap.value
  }

  const setDataSourceMap = (list) => {
    dataSourceMap.value = list.reduce((dMap, config) => {
      const dataSource: IDataSource = { config: config.data }

      const result = {
        code: '',
        msg: 'success',
        data: {}
      }
      result.data =
        dataSource.config.type === 'array'
          ? { items: dataSource?.config?.data ?? [], total: dataSource?.config?.data?.length }
          : dataSource?.config?.data

      dataSource.load = () => Promise.resolve(result)
      dMap[config.name] = dataSource

      return dMap
    }, {})
  }
  return {
    dataSourceMap,
    getDataSourceMap,
    setDataSourceMap
  }
}
