import { defineService, META_SERVICE } from '@opentiny/tiny-engine-meta-register'
import axios from './axios'

const addInterceptors = ({ data, http, type }) => {
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
  initialState: {
    http: null
  },
  options: {
    axiosConfig: {
      // axios 配置
      baseURL: '',
      withCredentials: false, // 跨域请求时是否需要使用凭证
      headers: {} // 请求头
    },
    enableMock: false, // 是否启用 mock
    mockData: {}, // mock 数据
    interceptors: {
      // 拦截器
      request: [], // 支持配置多个请求拦截器，先注册后执行
      response: [] // 支持配置多个响应拦截器，先注册先执行
    }
  },
  init: ({ state, options = {} }) => {
    const { axiosConfig = {}, interceptors = {}, enableMock, mockData } = options
    const http = axios(axiosConfig)

    enableMock && http.mock(mockData)

    const { request = [], response = [] } = interceptors

    addInterceptors({ data: request, http, type: 'request' })
    addInterceptors({ data: response, http, type: 'response' })

    state.http = http
  },
  apis: ({ state }) => ({
    getHttp: () => state.http,
    get: (...args) => state.http?.get(...args),
    post: (...args) => state.http?.post(...args),
    request: (...args) => state.http?.request(...args),
    put: (...args) => state.http?.put(...args),
    delete: (...args) => state.http?.delete(...args)
  })
})
