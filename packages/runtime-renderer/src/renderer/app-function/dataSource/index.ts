/**
 * Copyright (c) 2023 - present TinyEngine Authors.
 * Copyright (c) 2023 - present Huawei Cloud Computing Technologies Co., Ltd.
 *
 * Use of this source code is governed by an MIT-style license.
 *
 * THE OPEN SOURCE SOFTWARE IN THIS PRODUCT IS DISTRIBUTED IN THE HOPE THAT IT WILL BE USEFUL,
 * BUT WITHOUT ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS FOR
 * A PARTICULAR PURPOSE. SEE THE APPLICABLE LICENSES FOR MORE DETAILS.
 *
 */

import useHttp from './http.js'
const dataSourceMap: Record<string, any> = {}

const createFn = (fnStr: string) => {
  return (...args: any) => {
    const fn = new Function(`return ${fnStr}`)()
    return fn.apply(this, args)
  }
}

export const initDataSource = (dataSources: any) => {
  const globalWillFetch = dataSources.willFetch ? createFn(dataSources.willFetch.value) : (opt: any) => opt
  const globalDataHandle = dataSources.dataHandler ? createFn(dataSources.dataHandler.value) : (res: any) => res
  const globalErrorHandler = dataSources.errorHandler
    ? createFn(dataSources.errorHandler.value)
    : (err: any) => Promise.reject(err)
  const execProxy = (config: any) => {
    // TODO 通过全局配置代理， 通过代理服务器的方式获取接口数据，解决跨域问题
    const appId = new URLSearchParams(location.search).get('id')
    const { proxy = {} } = dataSources || {}
    if (proxy) {
      const isProxy = Object.keys(proxy).reduce((acc, cur) => acc || config.url.startsWith(cur), false)
      if (isProxy) {
        config.url = `/proxy/api${config.url}`
        config.headers = { ...config.headers, proxy_app_id: appId || 1 }
      }
    }
  }

  const load =
    (http: any, options: any, dataSource: any, shouldFetch: any) => (params: any, path: any, customConfig: any) => {
      // 如果没有配置远程请求，则直接返回静态数据，返回前可能会有全局数据处理
      if (!options) {
        return Promise.resolve(globalDataHandle(dataSource.config.data))
      }

      if (!shouldFetch()) {
        return Promise.resolve(undefined)
      }

      dataSource.status = 'loading'

      const { method, uri: url, params: defaultParams, timeout, headers } = options
      const config = { method, url, headers, timeout, ...customConfig }

      const data = params || defaultParams

      config.url = path ? `${config.url}/${path}` : config.url

      execProxy(config)

      if (['get', 'delete'].includes(method.toLowerCase())) {
        config.params = data
      } else {
        config.data = data
      }

      return http.request(config)
    }

  if (Array.isArray(dataSources.list)) {
    dataSources.list?.forEach((conf: any) => {
      const config = { name: conf.name, ...(conf.data || {}) }
      const dataSource: any = { config }
      dataSourceMap[config.name] = dataSource
      const shouldFetch = config.shouldFetch?.value ? createFn(config.shouldFetch.value) : () => true
      const willFetch = config.willFetch?.value ? createFn(config.willFetch.value) : (opt: any) => opt
      const dataHandler = (res: any) => {
        const data = config.dataHandler?.value ? createFn(config.dataHandler.value)(res) : res
        dataSource.status = 'loaded'
        dataSource.data = data
        return data
      }
      const errorHandler = (error: any) => {
        const err = config.errorHandler?.value ? createFn(config.errorHandler.value)(error) : error
        dataSource.status = 'error'
        dataSource.error = err
      }
      const http = useHttp({
        globalWillFetch,
        globalDataHandle,
        globalErrorHandler,
        willFetch,
        dataHandler,
        errorHandler
      })

      dataSource.status = 'init'
      dataSource.load = load(http, config.options, dataSource, shouldFetch)
    })
  }
}

export const getDataSource = () => dataSourceMap

export default dataSourceMap
