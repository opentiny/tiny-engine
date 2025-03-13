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

import Axios from 'axios'

const config = {
  withCredentials: false,
  baseURL: window.parent.location.origin
}

const axios = (config) => {
  const instance = Axios.create(config)
  const defaults = {}

  return {
    request(config) {
      return instance(config)
    },
    get(url, config) {
      return instance.get(url, config)
    },
    delete(url, config) {
      return instance.delete(url, config)
    },
    head(url, config) {
      return instance.head(url, config)
    },
    post(url, data, config) {
      return instance.post(url, data, config)
    },
    put(url, data, config) {
      return instance.put(url, data, config)
    },
    patch(url, data, config) {
      return instance.patch(url, data, config)
    },
    all(iterable) {
      return Axios.all(iterable)
    },
    spread(callback) {
      return Axios.spread(callback)
    },
    defaults(key, value) {
      if (key && typeof key === 'string') {
        if (typeof value === 'undefined') {
          return instance.defaults[key]
        }
        instance.defaults[key] = value
        defaults[key] = value
      } else {
        return instance.defaults
      }
    },
    defaultSettings() {
      return defaults
    },
    interceptors: {
      request: {
        use(fnHandle, fnError) {
          return instance.interceptors.request.use(fnHandle, fnError)
        },
        eject(id) {
          return instance.interceptors.request.eject(id)
        }
      },
      response: {
        use(fnHandle, fnError) {
          return instance.interceptors.response.use(fnHandle, fnError)
        },
        eject(id) {
          return instance.interceptors.response.eject(id)
        }
      }
    },
    CancelToken: Axios.CancelToken,
    isCancel: Axios.isCancel
  }
}

export default ({ globalWillFetch, globalDataHandle, globalErrorHandler, willFetch, dataHandler, errorHandler }) => {
  const http = axios(config)
  // axios对于request拦截器是后注册先执行
  http.interceptors.request.use(willFetch, errorHandler)
  http.interceptors.request.use(globalWillFetch, globalErrorHandler)
  http.interceptors.response.use(dataHandler, errorHandler)
  http.interceptors.response.use(globalDataHandle, globalErrorHandler)
  return http
}
