import type { BubbleContentItem } from '@opentiny/tiny-robot'
import type { ResponseToolCall } from './mcp.types'
import type { ChatMessage } from '@opentiny/tiny-robot-kit'

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

export type Message = ChatMessage & {
  renderContent: BubbleContentItem[]
  tool_calls: ResponseToolCall[]
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

export enum MessageContentStatus {
  INIT = 'init',
  PROCESSING = 'processing',
  STREAMING = 'streaming',
  FINISHED = 'finished',
  ABORTED = 'aborted',
  ERROR = 'error'
}

export enum MessageContentType {
  REASONING = 'reasoning'
}
