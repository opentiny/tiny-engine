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

/* eslint-disable no-undef */
import axios, { globalDefaults } from './axios'
import { createApp } from 'vue'
import { useBroadcastChannel } from '@vueuse/core'
import Login from './Login.vue'
import { getConfig } from './config'
import mockData from './mock'
import { constants } from '@opentiny/tiny-engine-utils'

const { BROADCAST_CHANNEL } = constants

const { post: globalNotify } = useBroadcastChannel({ name: BROADCAST_CHANNEL.Notify })

const procession = {
  promiseLogin: null,
  mePromise: {}
}

const LOGIN_EXPIRED_CODE = 401

const loginDom = document.createElement('div')
document.body.appendChild(loginDom)
const loginVM = createApp(Login).mount(loginDom)

const showError = (url, message) => {
  globalNotify({
    type: 'error',
    title: '接口报错',
    message: `报错接口: ${url} \n报错信息: ${message ?? ''}`
  })
}

window.lowcode = {
  platformCenter: {
    Session: {
      rebuiltCallback: function () {
        loginVM.closeLogin()

        procession.mePromise.resolve('login ok')
        procession.promiseLogin = null
        procession.mePromise = {}
      }
    }
  }
}

let http // 封装axios的http实例
let environment = import.meta.env // 当前设计器运行环境变量

const isVsCodeEnv = window.vscodeBridge
const isMock = () => environment.VITE_API_MOCK === 'mock'

export const createHttp = (options) => {
  // 缓存http实例，避免每个请求重新创建实例
  if (http && !options.force) {
    return http
  }
  const isDevelopEnv = environment.MODE?.includes('dev')
  const axiosConfig = getConfig(environment)
  http = axios(axiosConfig)

  // 如果未指定是否启用 mock，则本地开发时默认启用，模拟数据在 public/mock 目录下
  const { enableMock = isDevelopEnv } = options
  enableMock && http.mock(mockData)

  const preRequest = (config) => {
    if (isDevelopEnv && config.url.match(/\/generate\//)) {
      config.baseURL = ''
    }

    if (isVsCodeEnv) {
      config.baseURL = ''
    }

    return config
  }

  // 请求拦截器
  http.interceptors.request.use(preRequest)

  const preResponse = (res) => {
    if (res.data?.error) {
      showError(res.config?.url, res?.data?.error?.message)

      return Promise.reject(res.data.error)
    }

    return res.data?.data
  }

  const openLogin = () => {
    return new Promise((resolve, reject) => {
      if (!procession.promiseLogin) {
        procession.promiseLogin = loginVM.openLogin(procession, '/api/rebuildSession')
        procession.promiseLogin.then(() => {
          http.request(response.config).then(resolve, reject)
        })
      }
    })
  }

  const errorResponse = (error) => {
    // 用户信息失效时，弹窗提示登录
    const { response } = error
    if (response?.status === LOGIN_EXPIRED_CODE) {
      // vscode 插件环境弹出输入框提示登录
      if (window.vscodeBridge) {
        return Promise.resolve(true)
      }

      // 浏览器环境弹出小窗登录
      if (response?.headers['x-login-url']) {
        return openLogin()
      }
    }

    showError(error.config?.url, error?.message)

    return response?.data.error ? Promise.reject(response.data.error) : Promise.reject(error.message)
  }

  // 响应拦截器
  http.interceptors.response.use(preResponse, errorResponse)

  return http
}

/**
 * 根据环境不同初始化设置http参数
 * @param {*} env: 当前环境变量
 */
export const initHttp = ({ env }) => {
  if (Object.keys(env).length) {
    environment = env
  }
  const baseURL = environment.VITE_ORIGIN
  // 调用初始化方法前可能已经存在已经实例化的http，需要设置baseURL
  http?.defaults('baseURL', baseURL)
  globalDefaults('baseURL', baseURL)
  http = createHttp({ force: true, enableMock: isMock() })
}

export const useHttp = () => createHttp({ enableMock: isMock() })
