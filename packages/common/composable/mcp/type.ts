import type { Client } from '@modelcontextprotocol/sdk/client/index.js'
import type { MessageChannelTransport, MessageChannelServerTransport } from '@opentiny/next'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ToolCallback, RegisteredTool } from '@modelcontextprotocol/sdk/server/mcp.d.ts'
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
}
