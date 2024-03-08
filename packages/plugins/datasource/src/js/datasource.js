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

import axios from 'axios'
import { useResource } from '@opentiny/tiny-engine-controller'
import { generateFunction } from '@opentiny/tiny-engine-controller/utils'
import { isMock } from '@opentiny/tiny-engine-controller/js/environments'
import { utils as commonUtils, constants } from '@opentiny/tiny-engine-utils'
import { read, utils, writeFileXLSX } from 'xlsx'

const { DEFAULT_INTERCEPTOR } = constants

const load = (http, options, dataSource, shouldFetch) => (params, customUrl) => {
  if (!shouldFetch()) {
    return undefined
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

const createFn = (fnContent) => {
  return (...args) => {
    const fn = generateFunction(fnContent, this)
    return fn.apply(this, args)
  }
}

const defaultDataHandler = createFn(DEFAULT_INTERCEPTOR.dataHandler.value)
const defaultWillFetch = createFn(DEFAULT_INTERCEPTOR.willFetch.value)
const defaultErrorHandler = createFn(DEFAULT_INTERCEPTOR.errorHandler.value)

export const getRequest = (config) => {
  const globalDataHandle = useResource().resState.dataHandler
    ? createFn(useResource().resState.dataHandler.value)
    : defaultDataHandler

  const globalErrorHandler = useResource().resState.errorHandler
    ? createFn(useResource().resState.errorHandler.value)
    : defaultErrorHandler

  const globalWillFetch = useResource().resState.willFetch
    ? createFn(useResource().resState.willFetch.value)
    : defaultWillFetch

  const http = axios.create()

  http.interceptors.response.use(globalDataHandle, globalErrorHandler)

  const dataSource = { config }
  const shouldFetch = createFn(config.shouldFetch.value)
  const willFetch = createFn(config.willFetch.value)

  const dataHandler = (res) => {
    const data = createFn(config.dataHandler.value)(res)
    dataSource.status = 'loaded'
    dataSource.data = data
    return data
  }

  const errorHandler = (error) => {
    const reject = createFn(config.errorHandler.value)(error)
    dataSource.status = 'error'
    dataSource.error = error
    return reject
  }

  http.interceptors.request.use(willFetch, errorHandler)
  http.interceptors.request.use(globalWillFetch, globalErrorHandler) // axios对于request拦截器是后注册先执行

  http.interceptors.response.use(dataHandler, errorHandler)

  if (isMock) {
    http.mock([
      {
        url: config.options.uri,
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

  return dataSource
}

export const handleImportedData = (columns, importData) => {
  const titleMap = columns.reduce((prev, cur) => {
    prev[cur.title] = cur.name
    return prev
  }, {})
  return importData
    .map((item) => Object.fromEntries(Object.entries(item).map(([key, value]) => [titleMap[key], value])))
    .map((item) => {
      return { ...item, _id: item._id || commonUtils.guid() }
    })
}

export const getDataFromFile = async (file) => {
  const wb = read(await file.arrayBuffer())
  const array = utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]])

  return array
}

export const downloadFn = async (columns, fileName) => {
  const set = new Set(['操作'])
  const obj = columns
    .filter((col) => col.title && !set.has(col.title))
    .reduce((prev, cur) => {
      prev[cur.title] = ''
      return prev
    }, {})
  const ws = utils.json_to_sheet([obj])
  const wb = utils.book_new()
  utils.book_append_sheet(wb, ws, 'Data')
  writeFileXLSX(wb, fileName)
}

export const overrideOrMergeData = (isOverride, data, imported) => {
  if (isOverride) {
    return imported
  } else {
    return imported.concat(data || [])
  }
}

export const getDataAfterPage = (data, attrs) => {
  const { currentPage, pageSize } = attrs
  const offset = (currentPage - 1) * pageSize
  return data.slice(offset, offset + pageSize)
}
