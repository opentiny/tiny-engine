import type {
  AIModelConfig,
  ChatCompletionRequest,
  ChatCompletionResponse,
  StreamHandler
} from '@opentiny/tiny-robot-kit'
import { BaseModelProvider, handleSSEStream } from '@opentiny/tiny-robot-kit'
import { toRaw } from 'vue'
import { formatMessages } from '../utils/common-utils'
import { getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'
import { processSSEStream } from '../js/utils'

type ProviderConfig = Omit<AIModelConfig, 'provider' | 'providerImplementation'>

export class OpenAICompatibleProvider extends BaseModelProvider {
  private baseURL: string
  private apiKey: string
  private defaultModel: string = 'gpt-3.5-turbo'
  private beforeRequest: (request: unknown) => unknown = (params: unknown) => params

  /**
   * @param config AI模型配置
   */
  constructor(config: ProviderConfig, { beforeRequest }: { beforeRequest: (request: unknown) => unknown }) {
    super(config as AIModelConfig)
    this.baseURL = config.apiUrl || 'https://api.openai.com/v1/chat/completions'
    this.apiKey = config.apiKey || ''

    if (beforeRequest) {
      this.beforeRequest = beforeRequest
    }

    // 设置默认模型
    if (config.defaultModel) {
      this.defaultModel = config.defaultModel
    }
  }

  /**
   * 发送聊天请求并获取响应
   * @param request 聊天请求参数
   * @returns 聊天响应
   */
  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    try {
      const messages = formatMessages(toRaw(request.messages))

      const requestData = await this.beforeRequest({
        model: request.options?.model || this.config.defaultModel || this.defaultModel,
        messages,
        ...request.options,
        stream: false
      })

      const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      }
      if (this.apiKey) {
        Object.assign(options.headers, { Authorization: `Bearer ${this.apiKey}` })
      }
      const response = await fetch(`${this.baseURL}`, options)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`)
      }

      return await response.json()
    } catch (error: unknown) {
      // 处理错误
      throw new Error(`Error in chat request: ${error}`)
    }
  }

  /**
   * 发送流式聊天请求并通过处理器处理响应
   * @param request 聊天请求参数
   * @param handler 流式响应处理器
   */
  async chatStream(request: ChatCompletionRequest, handler: StreamHandler): Promise<void> {
    const { signal, ...options } = request.options || {}

    try {
      // 验证请求参数
      const messages = formatMessages(toRaw(request.messages))

      const requestData = await this.beforeRequest({
        model: request.options?.model || this.config.defaultModel || this.defaultModel,
        messages,
        ...options,
        stream: true
      })

      let lastResponseLength = 0
      const requestOptions = {
        method: 'POST',
        url: this.baseURL,
        data: requestData,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream'
        },
        onDownloadProgress: (progressEvent: { currentTarget: { responseText: any } }) => {
          const currentResponse = progressEvent.currentTarget.responseText
          const newData = currentResponse.substring(lastResponseLength)
          lastResponseLength = currentResponse.length
          processSSEStream(newData, handler)
        }
        // signal
      }
      if (this.apiKey) {
        Object.assign(requestOptions.headers, { Authorization: `Bearer ${this.apiKey}` })
      }
      await getMetaApi(META_SERVICE.Http).stream(requestOptions)
    } catch (error: unknown) {
      if (signal?.aborted) return
      handler.onError(error)
    }
  }

  async chatStreamWithFetch(request: ChatCompletionRequest, handler: StreamHandler): Promise<void> {
    const { signal, ...options } = request.options || {}

    try {
      // 验证请求参数
      const messages = formatMessages(toRaw(request.messages))

      const requestData = await this.beforeRequest({
        model: request.options?.model || this.config.defaultModel || this.defaultModel,
        messages,
        ...options,
        stream: true
      })

      const requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          Accept: 'text/event-stream'
        },
        body: JSON.stringify(requestData),
        signal
      }
      if (this.apiKey) {
        Object.assign(requestOptions.headers, { Authorization: `Bearer ${this.apiKey}` })
      }
      const response = await fetch(`${this.baseURL}`, requestOptions)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`)
      }

      await handleSSEStream(response, handler, signal)
    } catch (error: unknown) {
      if (signal?.aborted) return
      handler.onError(error)
    }
  }

  /**
   * 更新配置
   * @param config 新的AI模型配置
   */
  updateConfig(config: ProviderConfig): void {
    // 更新配置
    if (config.apiUrl) {
      this.baseURL = config.apiUrl
    }

    if (config.apiKey) {
      this.apiKey = config.apiKey
    }

    if (config.defaultModel) {
      this.defaultModel = config.defaultModel
    }
  }
}
