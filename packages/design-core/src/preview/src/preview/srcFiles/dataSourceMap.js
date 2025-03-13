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
import dataSources from './dataSource.js'
const createFn = (fnContent) => {
  return (...args) => {
    const fn = new Function(`return ${fnContent}`)()
    return fn.apply(this, args)
  }
}

const globalWillFetch = dataSources.willFetch ? createFn(dataSources.willFetch.value) : (opt) => opt
const globalDataHandle = dataSources.dataHandler ? createFn(dataSources.dataHandler.value) : (res) => res
const globalErrorHandler = dataSources.errorHandler
  ? createFn(dataSources.errorHandler.value)
  : (err) => Promise.reject(err)

const load = (http, options, dataSource, shouldFetch) => (params, customUrl) => {
  // 如果没有配置远程请求，则直接返回静态数据，返回前可能会有全局数据处理
  if (!options) {
    return Promise.resolve(globalDataHandle(dataSource.config.data))
  }

  if (!shouldFetch()) {
    return Promise.resolve(undefined)
  }

  dataSource.status = 'loading'

  const { method, uri: url, params: defaultParams, timeout, headers } = options
  const config = { method, url, headers, timeout }

  const data = params || defaultParams

  config.url = customUrl || config.url
  const { app, proxy } = window.appInfo || {}
  if (proxy) {
    const isProxy = Object.keys(proxy).reduce((acc, cur) => acc || config.url.startsWith(cur), false)
    if (isProxy) {
      config.url = `/app-proxy/api${config.url}`
      config.headers = { proxy_app_id: app || 918, ...headers }
    }
  }

  if (method.toLowerCase() === 'get') {
    config.params = data
  } else {
    config.data = data
  }

  return http.request(config)
}

const dataSourceMap = {}
if (Array.isArray(dataSources.list)) {
  dataSources.list?.forEach((config) => {
    const dataSource = { config }
    dataSourceMap[config.name] = dataSource

    const shouldFetch = config.shouldFetch?.value ? createFn(config.shouldFetch.value) : () => true
    const willFetch = config.willFetch?.value ? createFn(config.willFetch.value) : (options) => options
    const dataHandler = (res) => {
      const data = config.dataHandler?.value ? createFn(config.dataHandler.value)(res) : res
      dataSource.status = 'loaded'
      dataSource.data = data
      return data
    }
    const errorHandler = (error) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      config.errorHandler?.value && createFn(config.errorHandler.value)(error)
      dataSource.status = 'error'
      dataSource.error = error
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

export default dataSourceMap
