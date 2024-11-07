import { defineService, META_SERVICE } from '@opentiny/tiny-engine-meta-register'
import axios from 'axios'

let http = null

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
    const addInterceptors = createInterceptorHandler(http)
    addInterceptors({ data: request, type: 'request' })
    addInterceptors({ data: response, type: 'response' })
  },
  apis: () => ({
    getHttp: () => http,
    get: (...args) => http?.get(...args),
    post: (...args) => http?.post(...args),
    request: (...args) => http?.request(...args),
    put: (...args) => http?.put(...args),
    delete: (...args) => http?.delete(...args)
  })
})
