import type { Client } from '@modelcontextprotocol/sdk/client/index.js'
import type { MessageChannelTransport, MessageChannelServerTransport } from '@opentiny/next'
import type {
  McpServer,
  ResourceTemplate,
  ReadResourceCallback,
  ReadResourceTemplateCallback
} from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ToolCallback, RegisteredTool, RegisteredResource } from '@modelcontextprotocol/sdk/server/mcp.d.ts'
import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.d.ts'
import type { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import type { ZodRawShape } from 'zod'

export interface McpServerInstance {
  // 传输层对象，可以是 MessageChannelTransport 或 MessageChannelServerTransport
  transport: MessageChannelTransport | MessageChannelServerTransport | null
  // 服务器能力配置对象
  capabilities: Record<string, any>
}

export interface ToolItem {
  name: string
  title?: string
  description?: string
  inputSchema?: ZodRawShape | undefined
  outputSchema?: ZodRawShape | undefined
  annotations?: ToolAnnotations
  callback: ToolCallback<ZodRawShape | undefined>
}

export type ServerConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'disconnecting' | 'error'

export interface IState {
  mcpServer: McpServerInstance
  sessionID: string
  remoteTransport: StreamableHTTPClientTransport | null
  toolList: ToolItem[]
  toolInstanceMap: Map<string, RegisteredTool>
  server: McpServer | null
  mcpClient: Client | null
  serverConnectionStatus: ServerConnectionStatus
  resources: ResourceItem[]
  resourceTemplates: ResourceTemplateItem[]
  // 以 uri 为键缓存已注册的资源实例
  resourceInstanceMap?: Map<string, RegisteredResource>
}

// Resource related types for MCP resources feature
export interface ResourceContent {
  uri: string
  name: string
  title?: string
  mimeType?: string
  text?: string
}

// 模板参数约束规范
export interface VariableSpec {
  name: string
  required?: boolean
  type: 'enum' | 'string' | 'number' | 'integer' | 'boolean' | 'date' | 'datetime' | 'json' | 'regex'
  enumValues?: Array<{ value: string; title?: string; description?: string }>
  format?: string
  pattern?: string
  minLength?: number
  maxLength?: number
  minimum?: number
  maximum?: number
  constraintsDescription?: string
  example?: string
}

export interface ResourceItem {
  uri: string
  name?: string
  title?: string
  description?: string
  mimeType?: string
  annotations?: {
    audience?: Array<'assistant' | 'user'>
    priority?: number
  }
  // 官方回调（必需）：注册层只透传
  readCallback: ReadResourceCallback
}

export interface ResourceTemplateItem {
  uriTemplate: string
  name: string
  title?: string
  description?: string
  mimeType?: string
  annotations?: {
    audience?: Array<'assistant' | 'user'>
    priority?: number
  }
  // 模板参数列表与可选 schema 链接
  variables?: VariableSpec[]
  variablesSchemaUri?: string
  // 官方模板对象（可选）：资源侧可传入；否则注册层将基于 uriTemplate 构造
  template?: ResourceTemplate
  readTemplateCallback: ReadResourceTemplateCallback
}
