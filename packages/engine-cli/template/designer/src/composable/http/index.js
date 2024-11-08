import { HttpService } from '@opentiny/tiny-engine'

const preRequest = (config) => {
  return config
}

const preResponse = (res) => {
  return res.data?.data
}

const errorResponse = (error) => {
  return Promise.reject(error.message)
}

const getConfig = (env = import.meta.env) => {
  return {
    baseURL: env.VITE_ORIGIN,
    headers: {
      'x-lowcode-mode': env.MODE
    }
  }
}

const options = {
  axiosConfig: getConfig(),
  enableMock: false,
  mockData: {},
  interceptors: {
    request: [preRequest],
    response: [[preResponse, errorResponse]]
  }
}

HttpService.apis.setOptions(options)

export default HttpService
