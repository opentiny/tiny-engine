import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import type { Tool as MCPTool } from '@modelcontextprotocol/sdk/types.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

export type Tool = MCPTool

interface ServerConfig {
  id?: string
  url?: string
  type: string
  [key: string]: unknown
}

type Transport = SSEClientTransport | StreamableHTTPClientTransport

export class MCPHost {
  private clients: Map<string, Client> = new Map()
  private transports: Map<string, Transport> = new Map()

  async connectToServer(serverConfig: ServerConfig): Promise<{ id: string; tools: Tool[] }> {
    if (!serverConfig || !serverConfig.url) {
      throw new Error(`Server configuration not found`)
    }
    // 未配置名字时使用随机uuid名字
    const serverId = serverConfig.id || crypto.randomUUID()
    let transport: Transport
    if (serverConfig.type.toLowerCase() === 'sse') {
      transport = await this.createSSETransport(serverConfig.url)
    } else if (serverConfig.type.toLowerCase() === 'streamablehttp') {
      transport = await this.createStreamableHTTPTransport(serverConfig.url)
    } else {
      throw new Error(`Invalid server type: ${serverConfig.type}`)
    }
    const client = new Client(
      {
        name: serverId,
        version: '1.0.0'
      },
      {
        capabilities: {
          prompts: {},
          resources: {},
          tools: {}
        }
      }
    )
    await client.connect(transport)

    this.clients.set(serverId, client)
    this.transports.set(serverId, transport)
    // 列出可用工具
    const response = await client.listTools()

    return {
      id: serverId,
      tools: response.tools
    }
  }

  async listTools(serverId: string): Promise<Tool[]> {
    const client = this.clients.get(serverId)
    if (!client) {
      throw new Error(`Server configuration not found for: ${serverId}`)
    }
    const response = await client.listTools()
    return response.tools
  }

  setClient(serverId: string, client: Client, transport?: Transport): void {
    if (!serverId || !client) return
    this.clients.set(serverId, client)
    if (transport) {
      this.transports.set(serverId, transport)
    }
  }

  getClient(serverId: string): Client | null {
    return this.clients.get(serverId) as Client
  }

  async callTool({
    serverId,
    toolName,
    toolArgs
  }: {
    serverId: string
    toolName: string
    toolArgs: any
  }): Promise<any> {
    const client = this.clients.get(serverId)
    if (!client) {
      throw new Error(`Server configuration not found for: ${serverId}`)
    }
    const response = await client.callTool({
      name: toolName,
      arguments: toolArgs
    })
    return response
  }

  private async createSSETransport(url: string): Promise<SSEClientTransport> {
    return new SSEClientTransport(new URL(url))
  }
  private async createStreamableHTTPTransport(url: string): Promise<StreamableHTTPClientTransport> {
    return new StreamableHTTPClientTransport(new URL(url))
  }

  async disconnect(serverId: string): Promise<void> {
    const client = this.clients.get(serverId)
    if (!client) {
      throw new Error(`Server configuration not found for: ${serverId}`)
    }
    // await client.disconnect();
    this.clients.delete(serverId)
    const transport = this.transports.get(serverId)
    if (transport) {
      await transport.close()
      this.transports.delete(serverId)
    }
  }

  async cleanup(): Promise<void> {
    for (const transport of Array.from(this.transports.values())) {
      await transport.close()
    }
    this.transports.clear()
    this.clients.clear()
  }

  hasActiveSessions(): boolean {
    return this.clients.size > 0
  }
}
