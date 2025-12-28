import { defineService, META_SERVICE, getMergeMeta, getMetaApi, useModal } from '@opentiny/tiny-engine-meta-register'
import axios from 'axios'
import { useBroadcastChannel } from '@vueuse/core'
import { constants } from '@opentiny/tiny-engine-utils'

const { BROADCAST_CHANNEL } = constants
const { post: globalNotify } = useBroadcastChannel({ name: BROADCAST_CHANNEL.Notify })
let http = null
let isUnauthorized = false // 标记是否已发现未授权
let requestCount = 0 // 记录请求计数
const abortControllers = new Map()
// 白名单检查：登录相关接口放行
const whiteList = [
  '/platform-center/api/user/login',
  '/platform-center/api/user/register',
  '/platform-center/api/user/forgot-password',
  '/platform-center/api/user/me',
  '/platform-center/api/user/tenant'
]

// 创建 AbortController 并关联到请求
const createAbortController = (config) => {
  const controller = new AbortController()
  config.signal = controller.signal
  return controller
}

// 取消所有进行中的请求
const abortAllRequests = (message = '用户未登录，请求已取消') => {
  abortControllers.forEach((controller, key) => {
    controller.abort(message)
  })
  abortControllers.clear()
}

const showError = (url, message) => {
  // 如果是取消的请求，不显示错误提示
  if (axios.isCancel(message) || (message && message.name === 'AbortError') || message.name === 'CanceledError') {
    return
  }

  globalNotify({
    type: 'error',
    title: '接口报错',
    message: `报错接口: ${url} \n报错信息: ${message ?? ''}`
  })
}

const createInterceptorHandler =
  (http) =>
  ({ data, type }) => {
    if (typeof data === 'function') {
      http.interceptors[type].use(data)

      return
    }

    if (Array.isArray(data)) {
      data.forEach((item) => {
        if (!item) return

        if (Array.isArray(item)) {
          http.interceptors[type].use(...item)

          return
        }

        if (typeof item === 'function') {
          http.interceptors[type].use(item)
        }
      })
    }
  }

const requestHandler = (config) => {
  requestCount++

  const controller = createAbortController(config)
  const requestKey = `${config.method}_${config.url}_${requestCount}`
  abortControllers.set(requestKey, controller)

  const isWhiteList = whiteList.some((url) => config.url.includes(url))

  // 如果已经发现未授权，直接取消请求
  if (isUnauthorized && !isWhiteList) {
    controller.abort('用户未登录，请求已取消')
    return new Promise(() => {
      // 这个Promise永远不会resolve或reject
    })
  }

  const isDevelopEnv = import.meta.env.MODE?.includes('dev')
  if (isDevelopEnv && config.url.match(/\/generate\//)) {
    config.baseURL = ''
  }

  const isVsCodeEnv = window.vscodeBridge
  if (isVsCodeEnv) {
    config.baseURL = ''
  }

  const token = localStorage.getItem('engineToken')
  if (!token) {
    const { setNeedToLogin, getLoginStatus } = getMetaApi(META_SERVICE.GlobalService)
    if (!isWhiteList) {
      isUnauthorized = true
      controller.abort('用户未登录，请求已取消')

      abortAllRequests('用户未登录，所有请求已取消')

      const isLoginModalShown = getLoginStatus?.() || false

      // 只在首次发现未登录时显示弹窗
      if (!isLoginModalShown) {
        setNeedToLogin(true)
      }
      console.log('getLoginStatus', getLoginStatus())
      return new Promise(() => {})
    }
  } else {
    config.headers.Authorization = `Bearer ${token}`
  }

  // 请求结束时清理 AbortController
  config.cleanupAbortController = () => {
    abortControllers.delete(requestKey)
  }

  return config
}

const responseSuccessHandler = (res) => {
  // 请求成功时移除 AbortController
  if (res.config?.cleanupAbortController) {
    res.config.cleanupAbortController()
  }

  if (res.data?.error) {
    showError(res.config?.url, res?.data?.error?.message)

    return Promise.reject(res.data.error)
  }

  return res.data?.data || res.data
}

const responseErrorHandler = (error) => {
  if (error.config?.cleanupAbortController) {
    error.config.cleanupAbortController()
  }

  if (axios.isCancel(error) || error.name === 'AbortError' || error.name === 'CanceledError') {
    return Promise.reject(error)
  }

  if (error.type === 'NO_TOKEN') {
    return Promise.reject(error)
  }

  const { response } = error

  if (response) {
    const { setNeedToLogin } = getMetaApi(META_SERVICE.GlobalService)
    const { data } = response
    console.log('data', data)
    const LoginErrorCode = ['CM004', 'CM005', 'CM006', 'CM007', 'CM336', 'CM339']
    if (data && data.code && LoginErrorCode.includes(data.code)) {
      isUnauthorized = true

      abortAllRequests('认证失败，需要重新登录')

      setNeedToLogin(true)
      localStorage.removeItem('engineToken')

      return Promise.reject({
        type: 'AUTH_ERROR',
        code: data.code,
        message: data.message || '认证失败，请重新登录',
        skipShowError: true
      })
    }
  }

  // 只有非认证相关的错误才显示全局错误提示
  if (!error.skipShowError) {
    showError(error.config?.url, error?.message)
  }

  return response?.data.error ? Promise.reject(response.data.error) : Promise.reject(error.message)
}

// 全局请求拦截器，用于处理请求取消
const requestInterceptor = (config) => {
  return new Promise((resolve, reject) => {
    try {
      // 如果已经未授权且不是白名单请求，直接拒绝
      if (isUnauthorized) {
        const isWhiteList = whiteList.some((url) => config.url.includes(url))

        if (!isWhiteList) {
          reject({
            type: 'REQUEST_BLOCKED',
            message: '用户未登录，请求被阻止',
            config
          })
          return
        }
      }

      // 继续执行其他拦截器
      resolve(config)
    } catch (error) {
      reject(error)
    }
  })
}

export default defineService({
  id: META_SERVICE.Http,
  type: 'MetaService',
  options: {
    axiosConfig: {
      // axios 配置
      baseURL: '',
      withCredentials: false, // 跨域请求时是否需要使用凭证
      headers: {} // 请求头
    },
    interceptors: {
      // 拦截器
      request: [], // 支持配置多个请求拦截器，先注册后执行
      response: [] // 支持配置多个响应拦截器，先注册先执行
    }
  },
  init: ({ options = {} }) => {
    const { axiosConfig = {}, interceptors = {} } = options
    const { request = [], response = [] } = interceptors

    http = axios.create(axiosConfig)

    const enableLogin = getMergeMeta('engine.config')?.enableLogin
    if (enableLogin) {
      http.interceptors.request.use(requestHandler)
      http.interceptors.response.use(responseSuccessHandler, responseErrorHandler)
    } else {
      const addInterceptors = createInterceptorHandler(http)
      addInterceptors({ data: request, type: 'request' })
      addInterceptors({ data: response, type: 'response' })
    }
  },
  apis: () => ({
    getHttp: () => http,
    get: (...args) => http?.get(...args),
    post: (...args) => http?.post(...args),
    request: (...args) => http?.request(...args),
    put: (...args) => http?.put(...args),
    delete: (...args) => http?.delete(...args),
    stream: (config) => {
      const streamConfig = {
        responseType: 'stream',
        ...config
      }
      return http?.request(streamConfig)
    },
    // 新增：提供取消所有请求的方法
    abortAllRequests: () => abortAllRequests()
  })
})
