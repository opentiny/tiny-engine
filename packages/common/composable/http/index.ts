import { defineService, META_SERVICE } from '@opentiny/tiny-engine-meta-register'
import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, type CreateAxiosDefaults } from 'axios'

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
    registerInterceptors(http.interceptors.request, request)
    registerInterceptors(http.interceptors.response, response)
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
