import useHttp from './http'
import { useAppSchema } from '../composables/useAppSchema'
import { parseJSFunction } from '../utils/data-utils'

const { dataSourceConfig } = useAppSchema()

// 深拷贝防止修改原始 reactive
const rawConfig = JSON.parse(JSON.stringify(dataSourceConfig.value || {}))

// 将原本的配置格式标准化以方便复用出码逻辑
const normalizeItem = (item: any) => {
  return {
    id: item.id,
    name: item.name,
    columns: item.data.columns,
    data: item.data.data,
    type: item.data.type,
    options: item.data.options,
    dataHandler: item.data.dataHandler,
    willFetch: item.data.willFetch,
    shouldFetch: item.data.shouldFetch,
    errorHandler: item.data.errorHandler
  }
}

const dataSources = {
  dataHandler: rawConfig.dataHandler,
  list: (rawConfig.list || []).map(normalizeItem)
}

export const dataSourceMap: Record<string, any> = {}

const globalDataHandle = dataSources.dataHandler ? parseJSFunction(dataSources.dataHandler) : (res) => res

// 统一的 load 构造
const load = (http, options, dataSource, shouldFetch) => (params?, customUrl?) => {
  // 无 options 视为本地/静态数据
  if (!options) {
    try {
      const raw = globalDataHandle(dataSource.config.data)
      const items = Array.isArray(raw) ? raw : raw ? [raw] : []
      const wrapped = { code: '', msg: 'success', data: { items, total: items.length } }
      dataSource.status = 'loaded'
      dataSource.data = wrapped
      return Promise.resolve(wrapped)
    } catch (e) {
      dataSource.status = 'error'
      dataSource.error = e
      return Promise.reject(e)
    }
  }

  if (!shouldFetch()) {
    return Promise.resolve(undefined)
  }

  dataSource.status = 'loading'
  const { method = 'GET', uri: url, params: defaultParams, timeout, headers } = options
  const config: any = { method, url, headers, timeout }

  const data = params || defaultParams
  config.url = customUrl || config.url

  if (method.toLowerCase() === 'get') {
    config.params = data
  } else {
    config.data = data
  }

  return http.request(config)
}

// 构建每个数据源
dataSources.list.forEach((config) => {
  const http = useHttp(globalDataHandle)
  const dataSource = {
    config: config,
    status: 'init',
    data: { data: config.data } // 保持占位，后续 remote 成功后再写
  }

  dataSourceMap[config.name] = dataSource

  const shouldFetch = config.shouldFetch?.value ? parseJSFunction(config.shouldFetch) : () => true
  const willFetch = config.willFetch?.value ? parseJSFunction(config.willFetch) : (options) => options

  const dataHandler = (res) => {
    const handled = config.dataHandler?.value ? parseJSFunction(config.dataHandler)(res) : res
    dataSource.status = 'loaded'
    dataSource.data = handled
    return handled
  }

  const errorHandler = (error) => {
    if (config.errorHandler?.value) {
      parseJSFunction(config.errorHandler)(error)
    }
    dataSource.status = 'error'
    dataSource.error = error
    return Promise.reject(error)
  }

  http.interceptors.request.use(willFetch, errorHandler)
  http.interceptors.response.use(dataHandler, errorHandler)

  if (import.meta.env.VITE_APP_MOCK === 'mock') {
    http.mock([
      {
        url: config.options?.uri,
        response() {
          return Promise.resolve([200, { data: config.data }])
        }
      },
      { url: '*', proxy: '*' }
    ])
  }

  dataSource.load = load(http, config.options, dataSource, shouldFetch)
})

export default dataSourceMap
