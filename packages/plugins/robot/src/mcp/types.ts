import type { BubbleContentItem } from '@opentiny/tiny-robot'

export interface RequestOptions {
  url?: string
  model?: string
  headers?: Record<string, string>
}

export interface RequestTool {
  type: 'function'
  function: {
    name: string
    description: string
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
  [prop: string]: unknown
}

export interface LLMRequestBody {
  model?: string
  stream: boolean
  messages: LLMMessage[]
  tools?: RequestTool[]
}

export interface ReponseToolCall {
  id: string
  function: {
    name: string
    arguments: string
  }
}

export interface LLMResponse {
  choices: Array<{
    message: {
      role?: string
      content: string
      tool_calls?: Array<ReponseToolCall>
      [prop: string]: unknown
    }
  }>
}

export interface McpTool {
  name: string
  description: string
  inputSchema?: {
    type: 'object'
    properties: Record<
      string,
      {
        type: string
        description: string
        [prop: string]: unknown
      }
    >
    [prop: string]: unknown
  }
  [prop: string]: unknown
}

export interface McpListToolsResponse {
  tools: Array<McpTool>
}
