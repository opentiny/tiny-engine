import { createApp } from 'vue'
import { useBroadcastChannel } from '@vueuse/core'
import { constants } from '@opentiny/tiny-engine-utils'
import { getMetaApi, http } from '@opentiny/tiny-engine'
import Login from './Login.vue'
import mockData from './mock'

const { BROADCAST_CHANNEL } = constants

const { post: globalNotify } = useBroadcastChannel({ name: BROADCAST_CHANNEL.Notify })
const showError = (url, message) => {
  globalNotify({
    type: 'error',
    title: '接口报错',
    message: `报错接口: ${url} \n报错信息: ${message ?? ''}`
  })
}

const loginDom = document.createElement('div')
document.body.appendChild(loginDom)
const loginVM = createApp(Login).mount(loginDom)

const procession = {
  promiseLogin: null,
  mePromise: {}
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



const LOGIN_EXPIRED_CODE = 401

export const errorResponse = (error) => {
  // 用户信息失效时，弹窗提示登录
  const { response } = error

  const openLogin = () => {
    return new Promise((resolve, reject) => {
      if (!procession.promiseLogin) {
        procession.promiseLogin = loginVM.openLogin(procession, '/api/rebuildSession')
        procession.promiseLogin.then(() => {
          getMetaApi('engine.service.http').request(response.config).then(resolve, reject)
          // http.request(response.config).then(resolve, reject)
        })
      }
    })
  }

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

  // 默认的 error response 显示接口错误
  showError(error.config?.url, error?.message)

  return response?.data.error ? Promise.reject(response.data.error) : Promise.reject(error.message)
}

function getConfig(env = import.meta.env) {
  const baseURL = env.VITE_ORIGIN || ''

  // 仅在本地开发时，启用 withCredentials
  const dev = env.MODE?.includes('dev')

  // 获取租户 id
  const getTenant = () => new URLSearchParams(location.search).get('tenant')

  return {
    baseURL,
    withCredentials: false,
    headers: {
      'x-lowcode-mode': dev ? 'develop' : null,
      'x-lowcode-org': getTenant()
    }
  }
}

const isVsCodeEnv = window.vscodeBridge
let environment = import.meta.env
const isDevelopEnv = environment.MODE?.includes('dev')
const isMock = environment.VITE_API_MOCK === 'mock'

const preRequest = (config) => {
  if (isDevelopEnv && config.url.match(/\/generate\//)) {
    config.baseURL = ''
  }

  if (isVsCodeEnv) {
    config.baseURL = ''
  }

  return config
}

const { interceptors } = http

export const httpConfig = {
  config: getConfig,
  interceptors: {
    request: [preRequest],
    response: [interceptors.response[0], errorResponse]
  },
  mock: isMock,
  mockData: isMock ? mockData : []
}

