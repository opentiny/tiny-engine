import { toRaw } from 'vue'
import type {
  AIModelConfig,
  ChatCompletionRequest,
  ChatCompletionResponse,
  StreamHandler,
  AIAdapterError
} from '@opentiny/tiny-robot-kit'
import { BaseModelProvider, handleSSEStream, ErrorType } from '@opentiny/tiny-robot-kit'
import { formatMessages } from '../utils'

interface AxiosRequestConfig {
  url: string
  method: string
  apiUrl?: string
  headers: Record<string, string>
  data?: unknown
  signal?: AbortSignal
  adapter?: (config: AxiosRequestConfig) => Promise<unknown>
}

interface AxiosInstance {
  request: (config: AxiosRequestConfig) => Promise<{ data: unknown }>
}

// 定义请求数据类型
export interface ChatRequestData {
  model: string
  messages: unknown[]
  stream: boolean
  [key: string]: unknown
}

export type ProviderConfig = Omit<AIModelConfig, 'provider' | 'providerImplementation'> & {
  apiUrl?: string
  httpClientType?: 'axios' | 'fetch'
  axiosClient?: AxiosInstance | (() => AxiosInstance)
  beforeRequest?: (request: ChatRequestData) => ChatRequestData | Promise<ChatRequestData>
}

export class OpenAICompatibleProvider extends BaseModelProvider {
  private apiUrl: string = 'https://api.openai.com/v1/chat/completions'
  private apiKey: string = ''
  private defaultModel: string = 'gpt-3.5-turbo'
  private beforeRequest: (request: ChatRequestData) => ChatRequestData | Promise<ChatRequestData> = (req) => req
  private httpClientType: 'axios' | 'fetch' = 'fetch'
  private axiosClient: AxiosInstance | (() => AxiosInstance) | undefined

  /**
   * @param config AI模型配置
   * @param options 额外选项
   */
  constructor(providerConfig: ProviderConfig) {
    const { beforeRequest, httpClientType, axiosClient, ...config } = providerConfig
    super(config as AIModelConfig)
    this.setConfig(providerConfig)
  }

  /**
   * 将错误转换为AIAdapterError格式
   * @private
   */
  private toAIAdapterError(error: unknown): AIAdapterError {
    if (error instanceof Error) {
      // 根据错误消息判断错误类型
      const message = error.message.toLowerCase()
      let type = ErrorType.UNKNOWN_ERROR
      let statusCode: number | undefined

      if (message.includes('http error')) {
        const statusMatch = message.match(/status:\s*(\d+)/)
        if (statusMatch) {
          statusCode = parseInt(statusMatch[1], 10)
          if (statusCode === 401 || statusCode === 403) {
            type = ErrorType.AUTHENTICATION_ERROR
          } else if (statusCode === 429) {
            type = ErrorType.RATE_LIMIT_ERROR
          } else if (statusCode >= 500) {
            type = ErrorType.SERVER_ERROR
          } else {
            type = ErrorType.NETWORK_ERROR
          }
        }
      } else if (message.includes('network') || message.includes('fetch')) {
        type = ErrorType.NETWORK_ERROR
      } else if (message.includes('timeout')) {
        type = ErrorType.TIMEOUT_ERROR
      }

      return {
        type,
        message: error.message,
        statusCode,
        originalError: error
      }
    }

    return {
      type: ErrorType.UNKNOWN_ERROR,
      message: String(error)
    }
  }

  /**
   * 构建请求头
   * @private
   */
  private buildHeaders(isStream = false): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    if (isStream) {
      headers.Accept = 'text/event-stream'
    }

    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`
    }

    return headers
  }

  /**
   * 准备请求数据
   * @private
   */
  private async prepareRequestData(request: ChatCompletionRequest, isStream: boolean): Promise<ChatRequestData> {
    const messages = formatMessages(toRaw(request.messages))

    const requestData: ChatRequestData = {
      model: request.options?.model || this.config.defaultModel || this.defaultModel,
      messages,
      stream: isStream
    }

    const beforeRequest = request.options?.beforeRequest || this.beforeRequest
    return beforeRequest(requestData)
  }

  /**
   * 创建Axios适配器，使用fetch实现
   * @private
   */
  private createFetchAdapter(requestData: ChatRequestData, isStream = false) {
    return async (config: AxiosRequestConfig) => {
      // 构建完整URL
      let url = config.url
      if (!url.startsWith('http') && config.apiUrl) {
        url = new URL(url, config.apiUrl).href
      }

      try {
        const fetchResponse = await fetch(url, {
          method: config.method.toUpperCase(),
          headers: config.headers,
          body: JSON.stringify(requestData),
          signal: config.signal
        })

        if (!fetchResponse.ok) {
          const errorText = await fetchResponse.text()
          throw new Error(`HTTP error! status: ${fetchResponse.status}, details: ${errorText}`)
        }

        if (isStream) {
          // 流式响应处理
          return {
            data: { response: fetchResponse },
            status: fetchResponse.status,
            statusText: fetchResponse.statusText,
            headers: fetchResponse.headers,
            config
          }
        }

        // 非流式响应处理
        let responseData: unknown
        try {
          responseData = await fetchResponse.json()
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          throw new Error(`Failed to parse response JSON: ${errorMessage}`)
        }

        return {
          data: responseData,
          status: fetchResponse.status,
          statusText: fetchResponse.statusText,
          headers: fetchResponse.headers,
          config
        }
      } catch (error) {
        // 增强错误信息
        if (error instanceof Error) {
          throw error
        }
        throw new Error(`Request failed: ${String(error)}`)
      }
    }
  }

  /**
   * 使用 fetch 发送请求
   * @private
   */
  private async sendFetchRequest(
    requestData: ChatRequestData,
    headers: Record<string, string>,
    signal?: AbortSignal
  ): Promise<Response> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestData),
      signal
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`)
    }

    return response
  }

  /**
   * 使用 axios 发送请求
   * @private
   */
  private async sendAxiosRequest(
    requestData: ChatRequestData,
    headers: Record<string, string>,
    isStream: boolean,
    signal?: AbortSignal
  ): Promise<unknown> {
    if (!this.axiosClient) {
      throw new Error('Axios client is not configured')
    }

    const requestOptions: AxiosRequestConfig = {
      method: 'POST',
      url: this.apiUrl,
      headers,
      data: requestData,
      signal,
      adapter: this.createFetchAdapter(requestData, isStream)
    }

    const axiosClient = typeof this.axiosClient === 'function' ? this.axiosClient() : this.axiosClient
    return await axiosClient.request(requestOptions)
  }

  /**
   * 发送聊天请求并获取响应
   * @param request 聊天请求参数
   * @returns 聊天响应
   */
  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    try {
      // 准备请求数据
      const requestData = await this.prepareRequestData(request, false)
      const headers = this.buildHeaders(false)

      if (this.httpClientType === 'axios' && this.axiosClient) {
        // 使用 axios 发送请求
        const response = await this.sendAxiosRequest(requestData, headers, false)
        return (response as { data: ChatCompletionResponse }).data || response
      } else {
        // 使用 fetch 发送请求
        const response = await this.sendFetchRequest(requestData, headers)
        return await response.json()
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw new Error(`Error in chat request: ${errorMessage}`)
    }
  }

  /**
   * 发送流式聊天请求并通过处理器处理响应
   * @param request 聊天请求参数
   * @param handler 流式响应处理器
   */
  async chatStream(request: ChatCompletionRequest, handler: StreamHandler): Promise<void> {
    const { signal } = request.options || {}

    try {
      // 准备请求数据
      const requestData = await this.prepareRequestData(request, true)
      const headers = this.buildHeaders(true)

      if (this.httpClientType === 'axios' && this.axiosClient) {
        // 使用 axios 发送流式请求
        const response = await this.sendAxiosRequest(requestData, headers, true, signal)
        const fetchResponse = (
          (response as { data: { response: Response } }).data || (response as { response: Response })
        ).response
        await handleSSEStream(fetchResponse, handler, signal)
      } else {
        // 使用 fetch 发送流式请求
        const response = await this.sendFetchRequest(requestData, headers, signal)
        await handleSSEStream(response, handler, signal)
      }
    } catch (error: unknown) {
      // 如果是用户主动取消，不报错
      if (signal?.aborted) {
        return
      }
      handler.onError(this.toAIAdapterError(error))
    }
  }

  setConfig(providerConfig: ProviderConfig): void {
    const { beforeRequest, httpClientType, axiosClient, ...config } = providerConfig

    // 更新基础配置
    super.updateConfig(config as AIModelConfig)

    if (config.apiUrl) {
      this.apiUrl = config.apiUrl
    }

    if (config.apiKey) {
      this.apiKey = config.apiKey
    }

    if (config.defaultModel) {
      this.defaultModel = config.defaultModel
    }

    if (beforeRequest) {
      this.beforeRequest = beforeRequest
    }

    if (httpClientType === 'axios' && axiosClient) {
      this.axiosClient = axiosClient
    } else {
      this.httpClientType = 'fetch'
    }

    // 验证配置
    if (this.httpClientType === 'axios' && !this.axiosClient) {
      throw new Error('axiosClient is required when httpClientType is axios')
    }
  }

  getBaseConfig(): ProviderConfig {
    return {
      apiKey: this.apiKey,
      apiUrl: this.apiUrl,
      defaultModel: this.defaultModel,
      httpClientType: this.httpClientType
    }
  }

  /**
   * 更新配置
   * @param config 新的AI模型配置
   */
  updateConfig(config: ProviderConfig): void {
    this.setConfig(config)
  }
}
