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
import { useBroadcastChannel } from '@vueuse/core'
import { constants } from '@opentiny/tiny-engine-utils'
import axios from './axios'

const { BROADCAST_CHANNEL } = constants

const { post: globalNotify } = useBroadcastChannel({ name: BROADCAST_CHANNEL.Notify })

const showError = (url, message) => {
  globalNotify({
    type: 'error',
    title: '接口报错',
    message: `报错接口: ${url} \n报错信息: ${message ?? ''}`
  })
}

const preResponse = (res) => {
  if (res.data?.error) {
    showError(res.config?.url, res?.data?.error?.message)

    return Promise.reject(res.data.error)
  }

  return res.data?.data
}

const errorResponse = (error) => {
  // 用户信息失效时，弹窗提示登录
  const { response } = error

  // 默认的 error response 显示接口错误
  showError(error.config?.url, error?.message)

  return response?.data.error ? Promise.reject(response.data.error) : Promise.reject(error.message)
}

const initialState = {
  http: null
}

export default {
  id: 'engine.service.http',
  options: {
    config: {},
    interceptors: {
      request: [],
      response: [preResponse, errorResponse]
    },
    mock: false,
    mockData: []
  },
  type: 'MetaService',
  initialState,
  apis: ({ state }) => ({
    http: state.http,
    request: state.http.request,
    get: state.http.get,
    post: state.http.post,
    put: state.http.put,
    delete: state.http.delete
  }),
  init: ({ state, options }) => {
    const { config, mock = false, mockData, interceptors } = options

    let axiosConfig = config

    // config 支持函数
    if (typeof axiosConfig === 'function') {
      axiosConfig = axiosConfig()
    }

    const http = axios(axiosConfig)

    if (mock) {
      http.mock(mockData)
    }

    if (Array.isArray(interceptors.request)) {
      http.interceptors.request.use(...interceptors.request)
    }

    if (Array.isArray(interceptors.response)) {
      http.interceptors.request.use(...interceptors.response)
    }

    state.http = http
  }
}
