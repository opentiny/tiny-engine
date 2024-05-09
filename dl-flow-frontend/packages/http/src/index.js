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
import axios from './axios'
import { createApp } from 'vue'
import { isMock, isVsCodeEnv, isDevelopEnv } from '@opentiny/tiny-engine-common/js/environments'
import { useBroadcastChannel, useSessionStorage } from '@vueuse/core'
import Login from './Login.vue'
import config from './config'
import mockData from './mock'
import { constants } from '@opentiny/tiny-engine-utils'

const { BROADCAST_CHANNEL } = constants

const { post: globalNotify } = useBroadcastChannel({ name: BROADCAST_CHANNEL.Notify })

const procession = {
  promiseLogin: null,
  mePromise: {}
}

const LOGIN_EXPIRED_CODE = 401
const BAD_REQUEST = 400;

const loginDom = document.createElement('div')
document.body.appendChild(loginDom)
const loginVM = createApp(Login).mount(loginDom)

const showError = (url, message) => {
  globalNotify({
    type: 'error',
    title: `接口 ${url} 请求报错`,
    message: `报错信息: ${message}`
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

export const createHttp = (options, extendsConfig) => {
  const http = axios({
    ...config,
    ...extendsConfig
  })

  // 如果未指定是否启用 mock，则本地开发时默认启用，模拟数据在 public/mock 目录下
  const { enableMock = isDevelopEnv } = options
  enableMock && http.mock(mockData)

  /**
   * 
   * @param {import('axios').AxiosRequestConfig} config 
   * @returns 
   */
  const preRequest = (config) => {
    if (isDevelopEnv && config.url.match(/\/generate\//)) {
      config.baseURL = ''
    }

    if (isVsCodeEnv) {
      config.baseURL = ''
    }
    const token = useSessionStorage('token', '');
    config.headers.Authorization = `Bearer ${token.value}`;
    return config
  }

  // 请求拦截器
  http.interceptors.request.use(preRequest)

  const preResponse = (res) => {
    if (res.data?.error) {
      showError(res.config?.url, res?.data?.error?.message)

      return Promise.reject(res.data.error)
    }
    if (res.data.data){
      return res.data.data;
    }
    return res.data;
  }

  const errorResponse = (error) => {
    // 用户信息失效时，弹窗提示登录
    const { response } = error
    if (response.status === LOGIN_EXPIRED_CODE){
      window.location.href = '/authentication.html'
      return Promise.reject('登录过期');
    }
    if (response.status === BAD_REQUEST){
      return Promise.reject(typeof response.data.message === 'string' ? response.data.message : response.data.message[0]);
    }
    return Promise.reject(response.data.message);
  }

  // 响应拦截器
  http.interceptors.response.use(preResponse, errorResponse)

  return http
}

export const useHttp = () => createHttp({ enableMock: isMock }, {})
export const useEndpoint = () => createHttp({enableMock: false})
