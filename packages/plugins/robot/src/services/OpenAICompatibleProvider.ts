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
  baseURL?: string
  headers: Record<string, string>
  data?: unknown
  signal?: AbortSignal
  adapter?: (config: AxiosRequestConfig) => Promise<unknown>
}

interface AxiosInstance {
  request: (config: AxiosRequestConfig) => Promise<{ data: unknown }>
}

interface ChatCompletionRequestOptions {
  options?: {
    model?: string
    apiUrl?: string
    signal?: AbortSignal
    beforeRequest?: (request: ChatRequestData) => ChatRequestData | Promise<ChatRequestData>
  }
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
    if (!(error instanceof Error)) {
      return {
        type: ErrorType.UNKNOWN_ERROR,
        message: String(error)
      }
    }

    const message = error.message.toLowerCase()
    let type = ErrorType.UNKNOWN_ERROR
    let statusCode: number | undefined

    if (message.includes('http error')) {
      const statusMatch = message.match(/status:\s*(\d+)/)
      if (statusMatch) {
        statusCode = parseInt(statusMatch[1], 10)
        const statusMap: Record<number, ErrorType> = {
          401: ErrorType.AUTHENTICATION_ERROR,
          403: ErrorType.AUTHENTICATION_ERROR,
          429: ErrorType.RATE_LIMIT_ERROR
        }
        type = statusMap[statusCode] || (statusCode >= 500 ? ErrorType.SERVER_ERROR : ErrorType.NETWORK_ERROR)
      }
    } else {
      const keywordMap: Record<string, ErrorType> = {
        network: ErrorType.NETWORK_ERROR,
        fetch: ErrorType.NETWORK_ERROR,
        timeout: ErrorType.TIMEOUT_ERROR
      }

      for (const [keyword, errorType] of Object.entries(keywordMap)) {
        if (message.includes(keyword)) {
          type = errorType
          break
        }
      }
    }

    return {
      type,
      message: error.message,
      statusCode,
      originalError: error
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
  private async prepareRequestData(
    request: Omit<ChatCompletionRequest, 'options'> & ChatCompletionRequestOptions,
    isStream: boolean
  ): Promise<ChatRequestData> {
    const messages = formatMessages(JSON.parse(JSON.stringify(request.messages)))

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
  private createFetchAdapter(isStream = false) {
    return async (config: AxiosRequestConfig) => {
      // 构建完整URL
      let url = config.url
      if (!url.startsWith('http') && config.baseURL) {
        const baseURL =
          config.baseURL.startsWith('http') && !config.baseURL.endsWith('/') ? `${config.baseURL}/` : config.baseURL
        url = new URL(url, baseURL).href
      }

      try {
        const fetchResponse = await fetch(url, {
          method: config.method.toUpperCase(),
          headers: config.headers,
          body: config.data as string,
          signal: config.signal
        })

        if (!fetchResponse.ok) {
          const errorText = await fetchResponse.text()
          const customError: any = new Error(
            `HTTP error! status: ${fetchResponse.status}${errorText ? ', details: ' + errorText : ''}`
          )
          customError.response = fetchResponse
          throw customError
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
    {
      signal,
      apiUrl
    }: {
      signal?: AbortSignal
      apiUrl?: string
    } = {}
  ): Promise<Response> {
    const response = await fetch(apiUrl || this.apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestData),
      signal
    })

    if (!response.ok) {
      const errorText = await response.text()
      const customError: any = new Error(
        `HTTP error! status: ${response.status}${errorText ? ', details: ' + errorText : ''}`
      )
      customError.response = response

      throw customError
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
    {
      isStream,
      signal,
      apiUrl
    }: {
      isStream: boolean
      signal?: AbortSignal
      apiUrl?: string
    } = { isStream: true }
  ): Promise<unknown> {
    if (!this.axiosClient) {
      throw new Error('Axios client is not configured')
    }

    const requestOptions: AxiosRequestConfig = {
      method: 'POST',
      url: apiUrl || this.apiUrl,
      headers,
      data: requestData,
      signal,
      adapter: this.createFetchAdapter(isStream)
    }

    const axiosClient = typeof this.axiosClient === 'function' ? this.axiosClient() : this.axiosClient
    return await axiosClient.request(requestOptions)
  }

  /**
   * 发送聊天请求并获取响应
   * @param request 聊天请求参数
   * @returns 聊天响应
   */
  async chat(
    request: Omit<ChatCompletionRequest, 'options'> & ChatCompletionRequestOptions
  ): Promise<ChatCompletionResponse> {
    const { signal, apiUrl } = request.options || {}
    try {
      // 准备请求数据
      const requestData = await this.prepareRequestData(request, false)
      const headers = this.buildHeaders(false)

      if (this.httpClientType === 'axios' && this.axiosClient) {
        // 使用 axios 发送请求
        const response = await this.sendAxiosRequest(requestData, headers, {
          isStream: false,
          apiUrl,
          signal
        })
        return (response as { data: ChatCompletionResponse }).data || response
      } else {
        // 使用 fetch 发送请求
        const response = await this.sendFetchRequest(requestData, headers, { apiUrl, signal })
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
  async chatStream(
    request: Omit<ChatCompletionRequest, 'options'> & ChatCompletionRequestOptions,
    handler: StreamHandler
  ): Promise<void> {
    const { signal, apiUrl } = request.options || {}

    try {
      // 准备请求数据
      const requestData = await this.prepareRequestData(request, true)
      const headers = this.buildHeaders(true)

      if (this.httpClientType === 'axios' && this.axiosClient) {
        // 使用 axios 发送流式请求
        const response = await this.sendAxiosRequest(requestData, headers, { isStream: true, signal, apiUrl })
        const fetchResponse = (
          (response as { data: { response: Response } }).data || (response as { response: Response })
        ).response
        await handleSSEStream(fetchResponse, handler, signal)
      } else {
        // 使用 fetch 发送流式请求
        const response = await this.sendFetchRequest(requestData, headers, { signal, apiUrl })
        await handleSSEStream(response, handler, signal)
      }
    } catch (error: unknown) {
      // 如果是用户主动取消，不报错
      if (signal?.aborted) {
        return
      }
      throw error
    }
  }

  setConfig(providerConfig: ProviderConfig): void {
    const { beforeRequest, httpClientType, axiosClient, ...config } = providerConfig

    // 更新基础配置
    super.updateConfig(config as AIModelConfig)

    if (config.apiUrl) {
      this.apiUrl = config.apiUrl
    }

    // apikey允许为空
    if (typeof config.apiKey === 'string') {
      this.apiKey = config.apiKey
    }

    if (config.defaultModel) {
      this.defaultModel = config.defaultModel
    }

    if (beforeRequest) {
      this.beforeRequest = beforeRequest
    }

    if (httpClientType === 'axios' && axiosClient) {
      this.httpClientType = 'axios'
      this.axiosClient = axiosClient
    } else if (httpClientType) {
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
