import { defineService, META_SERVICE } from '@opentiny/tiny-engine'
import axios from 'axios'
import AxiosMockAdapter from 'axios-mock-adapter'

let http = null
let mock = null

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
    },
    mockConfig: []
  },
  init: ({ options = {} }) => {
    const { axiosConfig = {}, interceptors = {}, enableMock } = options
    const { request = [], response = [] } = interceptors

    http = axios.create(axiosConfig)
    if (enableMock) {
      mock = new AxiosMockAdapter(http)
      mock.onGet(/\/mock\/bundle\.json$/).passThrough()
  
      mock.onAny().reply((config) => {
        const { mockConfig = [] } = options
        const mockItem = mockConfig.find((item) => {
          if (config.method.toUpperCase() !== item.method) {
            return false
          }
  
          if (typeof item.url === 'string') {
            return item.url === config.url
          }
  
          if (item.url instanceof RegExp) {
            return item.url.test(config.url)
          }
        })
  
        if (mockItem) {
          if (typeof mockItem.response === 'function') {
            return mockItem.response(config)
          }
          return mockItem.response
        }

        return [
          200,
          { 
            code: 200,
            errMsg: '当前 demo 暂未支持该接口，请前往GitHub 或者 Gitee 克隆项目完整体验',
            error: '当前 demo 暂未支持该接口，请前往GitHub 或者 Gitee 克隆项目完整体验', 
          }
        ]
      })
    }

    const addInterceptors = createInterceptorHandler(http)
    addInterceptors({ data: request, type: 'request' })
    addInterceptors({ data: response, type: 'response' })
  },
  apis: () => ({
    getHttp: () => http,
    getMock: () => mock,
    get: (...args) => http?.get(...args),
    post: (...args) => http?.post(...args),
    request: (...args) => http?.request(...args),
    put: (...args) => http?.put(...args),
    delete: (...args) => http?.delete(...args)
  })
})
