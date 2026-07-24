import type { BubbleContentItem } from '@opentiny/tiny-robot'
import type { ResponseToolCall } from './mcp.types'
import type { ChatMessage } from '@opentiny/tiny-robot-kit'
import type { ChatMode } from './mode.types'
import type { STATUS } from '../constants/status'

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

/**
 * 消息角色枚举。
 * 与模型协议中的 role 对齐，用于区分消息发送方。
 */
export enum RobotMessageRole {
  Assistant = 'assistant',
  User = 'user',
  System = 'system',
  Tool = 'tool'
}

/**
 * 气泡内容类型枚举。
 * type 描述的是一条消息中“某一段渲染内容”应该如何展示。
 */
export enum RobotMessageContentType {
  Text = 'text',
  Markdown = 'markdown',
  Tool = 'tool',
  Img = 'img',
  Image = 'image',
  ImageUrl = 'image_url',
  Loading = 'loading',
  AgentContent = 'agent-content',
  AgentLoading = 'agent-loading',
  Reasoning = 'reasoning'
}

/**
 * Agent 渲染片段状态。
 * item.status 描述的是单个 agent 片段的业务执行结果，不等同于会话级请求状态。
 */
export enum AgentMessageStatus {
  Loading = 'loading',
  Reasoning = 'reasoning',
  Running = 'running',
  Success = 'success',
  Failed = 'failed',
  Fix = 'fix'
}

export const AgentFinalStatuses = [
  AgentMessageStatus.Success,
  AgentMessageStatus.Failed,
  AgentMessageStatus.Fix
] as const

export type AgentFinalStatus = typeof AgentFinalStatuses[number]

export interface RobotTextContentPart {
  type: RobotMessageContentType.Text
  text?: string
  content?: string
}

export interface RobotImageUrlContentPart {
  type: RobotMessageContentType.ImageUrl
  image_url: {
    url: string
  }
}

export type RobotInputContentPart = string | RobotTextContentPart | RobotImageUrlContentPart

export interface BubbleTextContentItem extends BubbleContentItem {
  type: RobotMessageContentType.Text | RobotMessageContentType.Markdown
  content?: string
  text?: string
}

export interface BubbleImageContentItem extends BubbleContentItem {
  type: RobotMessageContentType.Img | RobotMessageContentType.Image
  content?: string
  url?: string
  image_url?: {
    url: string
  }
}

export interface BubbleToolContentItem extends BubbleContentItem {
  type: RobotMessageContentType.Tool
  name?: string
  status?: string
  content?: unknown
  toolCallId?: string
  formatPretty?: boolean
}

export interface BubbleLoadingContentItem extends BubbleContentItem {
  type: RobotMessageContentType.Loading
  content?: string
}

export interface BubbleAgentContentItem extends BubbleContentItem {
  type: RobotMessageContentType.AgentContent | RobotMessageContentType.AgentLoading
  status?: AgentMessageStatus | string
  content?: unknown
  contentType?: RobotMessageContentType | string
}

export type RobotRenderContentItem =
  | BubbleTextContentItem
  | BubbleImageContentItem
  | BubbleToolContentItem
  | BubbleLoadingContentItem
  | BubbleAgentContentItem
  | (BubbleContentItem & {
      type?: string
      content?: unknown
      status?: string
      text?: string
      url?: string
      image_url?: { url: string }
      toolCallId?: string
      contentType?: string
      formatPretty?: boolean
      name?: string
    })

export interface RobotMessageMetadata {
  chatMode?: ChatMode | string
  agentStatus?: AgentMessageStatus | string
  createdAt?: number
  updatedAt?: number
  id?: string
  model?: string
  [key: string]: unknown
}

export interface RobotMessageState {
  thinking?: boolean
  toolsHandled?: boolean
  toolCall?: Record<string, unknown>
  toolCallResults?: Record<string, unknown>
  [key: string]: unknown
}

export type RobotMessageContent = string | RobotInputContentPart[]

export type Message = ChatMessage & {
  role: RobotMessageRole | string
  content: RobotMessageContent
  renderContent: RobotRenderContentItem[]
  tool_calls: ResponseToolCall[]
  metadata?: RobotMessageMetadata
  state?: RobotMessageState
}

export interface RobotMessage extends Omit<Partial<ChatMessage>, 'role' | 'content' | 'renderContent' | 'tool_calls'> {
  role: RobotMessageRole | string
  content: RobotMessageContent
  renderContent?: RobotRenderContentItem[]
  tool_calls?: ResponseToolCall[]
  metadata?: RobotMessageMetadata
  state?: RobotMessageState
  loading?: boolean
  aborted?: boolean
  reasoning_content?: string
  originContent?: string
  [prop: string]: unknown
}

export interface MessageResolverContext {
  messages: RobotMessage[]
  /**
   * context.status 是当前整轮请求的生命周期状态：
   * pending/streaming/finished/error/aborted。
   */
  status: STATUS | string
}

export type MessageContentResolver = (message: RobotMessage, context: MessageResolverContext) => unknown

export const isAgentFinalStatus = (status: unknown): status is AgentFinalStatus => {
  return typeof status === 'string' && AgentFinalStatuses.includes(status as AgentFinalStatus)
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
