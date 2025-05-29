import { createApp } from 'vue'
import { HttpService } from '@opentiny/tiny-engine'
import { useBroadcastChannel } from '@vueuse/core'
import { constants } from '@opentiny/tiny-engine-utils'
import Login from './Login.vue'

const LOGIN_EXPIRED_CODE = 401
const { BROADCAST_CHANNEL } = constants

const { post: globalNotify } = useBroadcastChannel({ name: BROADCAST_CHANNEL.Notify })

const procession = {
  promiseLogin: null,
  mePromise: {}
}
let loginVM = null

const showError = (url, message) => {
  globalNotify({
    type: 'error',
    title: '接口报错',
    message: `报错接口: ${url} \n报错信息: ${message ?? ''}`
  })
}

const preRequest = (config) => {
  const isDevelopEnv = import.meta.env.MODE?.includes('dev')

  if (isDevelopEnv && config.url.match(/\/generate\//)) {
    config.baseURL = ''
  }

  const isVsCodeEnv = window.vscodeBridge

  if (isVsCodeEnv) {
    config.baseURL = ''
  }

  return config
}

const preResponse = (res) => {
  if (res.data?.error) {
    showError(res.config?.url, res?.data?.error?.message)

    return Promise.reject(res.data.error)
  }

  return res.data?.data
}

const openLogin = () => {
  if (!window.lowcode) {
    const loginDom = document.createElement('div')
    document.body.appendChild(loginDom)
    loginVM = createApp(Login).mount(loginDom)

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
  }

  return new Promise((resolve, reject) => {
    if (!procession.promiseLogin) {
      procession.promiseLogin = loginVM.openLogin(procession, '/api/rebuildSession')
      procession.promiseLogin.then((response) => {
        HttpService.apis.request(response.config).then(resolve, reject)
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

const getConfig = (env = import.meta.env) => {
  const baseURL = env.VITE_ORIGIN
  // 仅在本地开发时，启用 withCredentials
  const dev = env.MODE?.includes('dev')
  // 获取租户 id
  const getTenant = () => new URLSearchParams(location.search).get('tenant')

  return {
    baseURL,
    withCredentials: dev,
    headers: {
      ...(dev && { 'x-lowcode-mode': 'develop' }),
      'x-lowcode-org': getTenant()
    }
  }
}

const customizeHttpService = () => {
  const options = {
    axiosConfig: getConfig(),
    interceptors: {
      request: [preRequest],
      response: [[preResponse, errorResponse]]
    }
  }

  HttpService.apis.setOptions(options)

  return HttpService
}

export default customizeHttpService()
