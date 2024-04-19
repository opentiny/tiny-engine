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

import useHttp from '../http'
import dataSources from './dataSource.json'

const dataSourceMap = {}

// 暂时使用 eval 解析 JSON 数据里的函数
const createFn = (fnContent) => {
  return (...args) => {
    // eslint-disable-next-line no-eval
    window.eval('var fn = ' + fnContent)
    // eslint-disable-next-line no-undef
    return fn.apply(this, args)
  }
}

const globalDataHandle = dataSources.dataHandler ? createFn(dataSources.dataHandler.value) : (res) => res

const load = (http, options, dataSource, shouldFetch) => (params, customUrl) => {
  // 如果没有配置远程请求，则直接返回静态数据，返回前可能会有全局数据处理
  if (!options) {
    return globalDataHandle(dataSource.config.data)
  }

  if (!shouldFetch()) {
    return
  }

  dataSource.status = 'loading'

  const { method, uri: url, params: defaultParams, timeout, headers } = options
  const config = { method, url, headers, timeout }

  const data = params || defaultParams

  config.url = customUrl || config.url

  if (method.toLowerCase() === 'get') {
    config.params = data
  } else {
    config.data = data
  }

  return http.request(config)
}

dataSources.list.forEach((config) => {
  const http = useHttp(globalDataHandle)
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
    config.errorHandler?.value && createFn(config.errorHandler.value)(error)
    dataSource.status = 'error'
    dataSource.error = error
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
      {
        url: '*',
        proxy: '*'
      }
    ])
  }

  dataSource.status = 'init'
  dataSource.load = load(http, config.options, dataSource, shouldFetch)
})

export default dataSourceMap
