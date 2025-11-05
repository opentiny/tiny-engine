import type { BubbleContentItem } from '@opentiny/tiny-robot'
import type { ResponseToolCall } from './mcp.types'

export interface RequestOptions {
  url?: string
  model?: string
  headers?: Record<string, string>
  baseUrl?: string
}

export interface RequestTool {
  type: 'function'
  function: {
    name: string
    description: string
    title?: string
    parameters: {
      type: 'object'
      required?: string[]
      properties: Record<
        string,
        {
          type: string
          description: string
          [prop: string]: unknown
        }
      >
    }
  }
}

export interface LLMMessage {
  role: string
  content: string
  [prop: string]: unknown
}

export interface RobotMessage {
  role: string
  content: string | BubbleContentItem[]
  renderContent?: Array<BubbleContentItem>
  [prop: string]: unknown
}

export interface LLMRequestBody {
  baseUrl?: string
  model?: string
  stream: boolean
  messages: LLMMessage[]
  tools?: RequestTool[]
}

export interface LLMResponse {
  choices: Array<{
    message: {
      role?: string
      content: string
      tool_calls?: Array<ResponseToolCall>
      [prop: string]: unknown
    }
  }>
}
