import { useBroadcastChannel } from '@vueuse/core'
import { constants } from '@opentiny/tiny-engine-utils'
import HttpService from './httpServices'
import mockConfig from '../../routes'

const { BROADCAST_CHANNEL } = constants

const { post: globalNotify } = useBroadcastChannel({ name: BROADCAST_CHANNEL.Notify })

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
    showError(res.config?.url, res?.data?.error?.message || res?.data?.error)

    return Promise.reject(res.data.error)
  }

  return res.data?.data
}

const errorResponse = (error) => {
  const { response } = error

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
    },
    mockConfig,
    enableMock: true
  }

  HttpService.apis.setOptions(options)

  return HttpService
}

export default customizeHttpService()
