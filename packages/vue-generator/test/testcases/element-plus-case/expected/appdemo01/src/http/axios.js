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
import MockAdapter from 'axios-mock-adapter'

export default (config) => {
  const instance = axios.create(config)
  const defaults = {}
  let mock

  if (typeof MockAdapter.prototype.proxy === 'undefined') {
    MockAdapter.prototype.proxy = function ({ url, config = {}, proxy, response, handleData } = {}) {
      let stream = this
      const request = (proxy, any) => {
        return (setting) => {
          return new Promise((resolve) => {
            config.responseType = 'json'
            axios
              .get(any ? proxy + setting.url + '.json' : proxy, config)
              .then(({ data }) => {
                /* eslint-disable  no-useless-call */
                typeof handleData === 'function' && (data = handleData.call(null, data, setting))
                resolve([200, data])
              })
              .catch((error) => {
                resolve([error.response.status, error.response.data])
              })
          })
        }
      }

      if (url === '*' && proxy && typeof proxy === 'string') {
        stream = proxy === '*' ? this.onAny().passThrough() : this.onAny().reply(request(proxy, true))
      } else {
        if (proxy && typeof proxy === 'string') {
          stream = this.onAny(url).reply(request(proxy))
        } else if (typeof response === 'function') {
          stream = this.onAny(url).reply(response)
        }
      }

      return stream
    }
  }

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
      return axios.all(iterable)
    },
    spread(callback) {
      return axios.spread(callback)
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
    mock(config) {
      if (!mock) {
        mock = new MockAdapter(instance)
      }

      if (Array.isArray(config)) {
        config.forEach((item) => {
          mock.proxy(item)
        })
      }

      return mock
    },
    disableMock() {
      mock && mock.restore()
      mock = undefined
    },
    isMock() {
      return typeof mock !== 'undefined'
    },
    CancelToken: axios.CancelToken,
    isCancel: axios.isCancel
  }
}
