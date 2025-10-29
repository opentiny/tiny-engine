import useHttp from './http'
import { parseJSFunction } from '../utils/data-utils'
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

const dataSourceMap: Record<string, any> = {}

let globalDataHandle: (res: any) => any = (res) => res

// 统一的 load 构造
const load = (http, options, dataSource, shouldFetch, parsedDataHandler) => (params?, customUrl?) => {
  // 无 options 视为本地/静态数据
  if (!options) {
    try {
      let raw = globalDataHandle(dataSource.config.data)
      if (parsedDataHandler) {
        raw = parsedDataHandler(raw)
      }
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

export const initDataSource = (config: any) => {
  Object.keys(dataSourceMap).forEach((key) => delete dataSourceMap[key])

  if (!config) {
    return dataSourceMap
  }

  const normalized = (config.list || []).map(normalizeItem)

  globalDataHandle = config.dataHandler ? parseJSFunction(config.dataHandler) : (res) => res

  normalized.forEach((item) => {
    const http = useHttp(globalDataHandle)
    const dataSource = {
      config: item,
      status: 'init',
      data: { data: item.data },
      load: null // 将在下面设置
    }

    const shouldFetch = item.shouldFetch?.value ? parseJSFunction(item.shouldFetch) : () => true
    const willFetch = item.willFetch?.value ? parseJSFunction(item.willFetch) : (options) => options
    const parsedDataHandler = item.dataHandler?.value ? parseJSFunction(item.dataHandler) : null
    const parsedErrorHandler = item.errorHandler?.value ? parseJSFunction(item.errorHandler) : null

    const dataHandler = (res) => {
      // 先应用用户定义的dataHandler
      const handled = parsedDataHandler ? parsedDataHandler(res) : res

      // 统一数据结构，确保与远程数据源与静态数据源结构一致
      let unifiedData
      if (handled && typeof handled === 'object' && !handled.data?.items) {
        // 如果不是静态数据源的格式，则转换为统一格式
        const items = Array.isArray(handled.data) ? handled.data : handled.data ? [handled.data] : []
        unifiedData = {
          code: handled.code || '',
          msg: handled.message || handled.msg || 'success',
          data: {
            items,
            total: items.length
          }
        }
      } else {
        unifiedData = handled
      }

      dataSource.status = 'loaded'
      dataSource.data = unifiedData
      return unifiedData
    }
    const errorHandler = (error) => {
      if (parsedErrorHandler) {
        parsedErrorHandler(error)
      }
      dataSource.status = 'error'
      dataSource.error = error
      return Promise.reject(error)
    }

    http.interceptors.request.use(willFetch, errorHandler)
    http.interceptors.response.use(dataHandler, errorHandler)

    // 设置 load 方法，传递 parsedDataHandler 参数
    dataSource.load = load(http, item.options, dataSource, shouldFetch, parsedDataHandler)

    // 存储到映射中
    dataSourceMap[item.name] = dataSource
  })
}

export const getDataSource = () => dataSourceMap

export default dataSourceMap
