import { defineService, META_SERVICE, getMergeMeta, getMetaApi } from '@opentiny/tiny-engine-meta-register'
import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, type CreateAxiosDefaults } from 'axios'
import { useBroadcastChannel } from '@vueuse/core'
import { constants } from '@opentiny/tiny-engine-utils'

// 请求拦截器 fulfilled 函数类型
type RequestInterceptorFulfilled = (config: AxiosRequestConfig) => AxiosRequestConfig | Promise<AxiosRequestConfig>

// 响应拦截器 fulfilled 函数类型
type ResponseInterceptorFulfilled<T = unknown> = (
  response: AxiosResponse<T>
) => AxiosResponse<T> | Promise<AxiosResponse<T>>

// 拦截器 rejected 函数类型
type InterceptorRejected = (error: unknown) => unknown

// 请求拦截器函数类型（单个 fulfilled 函数 或 [fulfilled, rejected] 元组）
type RequestInterceptorFunction = RequestInterceptorFulfilled | [RequestInterceptorFulfilled, InterceptorRejected?]

// 响应拦截器函数类型（单个 fulfilled 函数 或 [fulfilled, rejected] 元组）
type ResponseInterceptorFunction<T = unknown> =
  | ResponseInterceptorFulfilled<T>
  | [ResponseInterceptorFulfilled<T>, InterceptorRejected?]

// 请求拦截器配置类型（支持单个函数、数组、嵌套数组）
type RequestInterceptorConfig = RequestInterceptorFunction | (RequestInterceptorFunction | undefined)[]

// 响应拦截器配置类型（支持单个函数、数组、嵌套数组）
type ResponseInterceptorConfig = ResponseInterceptorFunction | (ResponseInterceptorFunction | undefined)[]

// 通用拦截器类型（用于内部处理）
type InterceptorFunction = RequestInterceptorFunction | ResponseInterceptorFunction
type InterceptorConfig = RequestInterceptorConfig | ResponseInterceptorConfig

// 拦截器配置接口
interface InterceptorsConfig {
  request?: RequestInterceptorConfig
  response?: ResponseInterceptorConfig
}

// HTTP 服务选项接口
interface HttpServiceOptions {
  axiosConfig?: CreateAxiosDefaults
  interceptors?: InterceptorsConfig
}

let http: AxiosInstance | null = null

// 通用拦截器 fulfilled 函数类型
type InterceptorFulfilled = RequestInterceptorFulfilled | ResponseInterceptorFulfilled

// 通用拦截器处理器类型（内部使用）
type InterceptorHandler = {
  use: (onFulfilled?: (value: any) => any, onRejected?: (error: unknown) => unknown) => number
}

/**
 * 注册单个拦截器
 */
const registerInterceptor = (handler: InterceptorHandler, interceptor: InterceptorFunction): void => {
  if (typeof interceptor === 'function') {
    handler.use(interceptor)
  } else if (Array.isArray(interceptor)) {
    handler.use(interceptor[0], interceptor[1])
  }
}

/**
 * 注册拦截器配置（支持单个函数、元组、或数组）
 */
const registerInterceptors = (handler: InterceptorHandler, config?: InterceptorConfig): void => {
  if (!config) return

  // 单个函数
  if (typeof config === 'function') {
    handler.use(config)
    return
  }

  // 数组情况：判断是元组还是拦截器数组
  if (Array.isArray(config)) {
    const isTuple = config.length <= 2 && typeof config[0] === 'function' && typeof config[1] !== 'object'

    if (isTuple) {
      // [fulfilled, rejected?] 元组
      handler.use(config[0] as InterceptorFulfilled, config[1] as InterceptorRejected | undefined)
    } else {
      // 拦截器数组
      config.forEach((item) => item && registerInterceptor(handler, item as InterceptorFunction))
    }
  }
}

const { BROADCAST_CHANNEL } = constants
const { post: globalNotify } = useBroadcastChannel({ name: BROADCAST_CHANNEL.Notify })
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
// 不鉴权名单
const notAuthList = ['app-center/api/chat/completions', 'app-center/api/ai/chat', 'app-center/api/ai/search']
const LoginErrorCode = ['CM004', 'CM005', 'CM006', 'CM007', 'CM336', 'CM339']

// 新增：重置认证状态的函数
const resetAuthState = () => {
  isUnauthorized = false
  abortControllers.clear()
}

// 创建 AbortController 并关联到请求
const createAbortController = (config) => {
  const controller = new AbortController()
  config.signal = controller.signal
  return controller
}

// 取消所有进行中的请求
const abortAllRequests = (message = '用户未登录，请求已取消') => {
  abortControllers.forEach((controller) => {
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

const toLogin = () => {
  const { setNeedToLogin } = getMetaApi(META_SERVICE.GlobalService)
  isUnauthorized = true

  abortAllRequests('认证失败，需要重新登录')
  setNeedToLogin(true)
  localStorage.removeItem('engineToken')
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

      return new Promise(() => {})
    }
  } else {
    // 有 token 时重置认证状态
    if (isUnauthorized) {
      resetAuthState()
    }
    if (!notAuthList.some((url) => config.url.includes(url))) {
      config.headers.Authorization = `Bearer ${token}`
    }
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
    const error = res.data?.error
    if (error.code && LoginErrorCode.includes(error.code)) {
      toLogin()

      return Promise.reject({
        type: 'AUTH_ERROR',
        code: error.code,
        message: error.message || '认证失败，请重新登录',
        skipShowError: true
      })
    }

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
    const { data } = response

    if (data && data.code && LoginErrorCode.includes(data.code)) {
      toLogin()

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

export default defineService({
  id: META_SERVICE.Http,
  type: 'MetaService',
  initialState: {},
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
  } as HttpServiceOptions,
  init: ({ options = {} }: { options?: HttpServiceOptions }) => {
    const { axiosConfig = {}, interceptors = {} } = options
    const { request, response } = interceptors

    http = axios.create(axiosConfig)

    const enableLogin = getMergeMeta('engine.config')?.enableLogin
    if (enableLogin) {
      http.interceptors.request.use(requestHandler)
      http.interceptors.response.use(responseSuccessHandler, responseErrorHandler)
    } else {
      registerInterceptors(http.interceptors.request, request)
      registerInterceptors(http.interceptors.response, response)
    }
  },
  apis: () => ({
    /** 获取 axios 实例 */
    getHttp: (): AxiosInstance | null => http,

    /** GET 请求 */
    get: <T = unknown, R = AxiosResponse<T>, D = unknown>(
      url: string,
      config?: AxiosRequestConfig<D>
    ): Promise<R> | undefined => http?.get<T, R, D>(url, config),

    /** POST 请求 */
    post: <T = unknown, R = AxiosResponse<T>, D = unknown>(
      url: string,
      data?: D,
      config?: AxiosRequestConfig<D>
    ): Promise<R> | undefined => http?.post<T, R, D>(url, data, config),

    /** 通用请求方法 */
    request: <T = unknown, R = AxiosResponse<T>, D = unknown>(config: AxiosRequestConfig<D>): Promise<R> | undefined =>
      http?.request<T, R, D>(config),

    /** PUT 请求 */
    put: <T = unknown, R = AxiosResponse<T>, D = unknown>(
      url: string,
      data?: D,
      config?: AxiosRequestConfig<D>
    ): Promise<R> | undefined => http?.put<T, R, D>(url, data, config),

    /** DELETE 请求 */
    delete: <T = unknown, R = AxiosResponse<T>, D = unknown>(
      url: string,
      config?: AxiosRequestConfig<D>
    ): Promise<R> | undefined => http?.delete<T, R, D>(url, config),

    /** 流式请求 */
    stream: <T = unknown>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> | undefined => {
      const streamConfig: AxiosRequestConfig = {
        responseType: 'stream',
        ...config
      }
      return http?.request<T>(streamConfig)
    }
  })
})
