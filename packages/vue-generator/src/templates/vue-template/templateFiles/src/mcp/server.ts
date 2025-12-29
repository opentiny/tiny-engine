export default (schema, options) => {
  const { enabledTools } = options

  // 构建导入语句
  let toolImports = ''
  let registrations = ''

  if (enabledTools.includes('navigation')) {
    toolImports += `
import { registerNavigationTools } from './tools/navigationTools'`
    registrations += `
      registerNavigationTools(server, this.router!);`
  }

  if (enabledTools.includes('application')) {
    toolImports += `
import { registerApplicationTools } from './tools/applicationTools'`
    registrations += `
      registerApplicationTools(server);`
  }

  return `import type { Router } from 'vue-router'
import { WebMcpServer } from "@opentiny/next-sdk"
import { registerMcpConfig } from '@opentiny/vue-common'
import { createMcpTools, getTinyVueMcpConfig } from '@opentiny/tiny-vue-mcp'${toolImports}

// 配置接口
interface PageServerConfig {
  name: string
  business: {
    id: string
    description: string
  }
}

// MCP 服务器管理器
export class McpServerManager {
  private servers = new Map<string, WebMcpServer>()
  private mainServer: WebMcpServer | null = null
  private router: Router | null = null
  private capabilities: any = null

  /**
   * 注册服务器 tools
   * @param mode 模式：page 页面服务器，main 应用级别服务器
   * @param server 服务器实例
   */
  registerServerToolsByMode(mode: 'page' | 'main', server: WebMcpServer) {
    const commonRegistrations = () => {${registrations}
    };

    if (mode === 'main') {
      registerMcpConfig(getTinyVueMcpConfig(), createMcpTools);
    }

    commonRegistrations();
  }

  // 初始化管理器
  init(router: Router, config: any) {
    this.router = router
    this.capabilities = config.capabilities

    // 创建主服务器
    this.mainServer = new WebMcpServer(
      { name: "business-app", version: "1.0.0" },
      { capabilities: this.capabilities }
    )

    // 注册主服务器 tools
    this.registerServerToolsByMode('main', this.mainServer)
  }

  // 获取或创建页面服务器
  getPageServer(pageId: string, config?: PageServerConfig): WebMcpServer {
    // 返回缓存的服务器
    if (this.servers.has(pageId)) {
      return this.servers.get(pageId)!
    }

    // 创建新服务器
    const serverConfig = config || {
      name: pageId,
      business: { id: pageId, description: \`\${pageId} 页面\` }
    }

    const server = new WebMcpServer(
      { name: serverConfig.name, version: "1.0.0" },
      { capabilities: this.capabilities }
    )

    // 注册页面服务器 tools
    this.registerServerToolsByMode('page', server)

    // 缓存并返回
    this.servers.set(pageId, server)
    console.log(\`页面服务器 \${pageId} 创建完成\`)

    return server
  }

  // 连接所有服务器
  async connectAll(transport: any) {
    const results = []

    // 连接主服务器
    if (this.mainServer) {
      try {
        await this.mainServer.connect(transport)
        this.mainServer.transport = transport
        results.push({ name: 'main', success: true })
      } catch (error) {
        console.error('主服务器连接失败:', error)
        results.push({ name: 'main', success: false })
      }
    }

    // 连接页面服务器
    for (const [pageId, server] of this.servers.entries()) {
      try {
        await server.connect(transport)
        server.transport = transport
        results.push({ name: pageId, success: true })
      } catch (error) {
        console.error(\`页面服务器 \${pageId} 连接失败:\`, error)
        results.push({ name: pageId, success: false })
      }
    }

    console.log(\`服务器连接完成: \${results.filter(r => r.success).length}/\${results.length} 成功\`)
    return results
  }

  // 获取主服务器
  getMainServer() {
    return this.mainServer
  }

  // 清理页面服务器
  removePageServer(pageId: string) {
    const server = this.servers.get(pageId)
    if (server) {
      server.transport = null
      this.servers.delete(pageId)
      console.log(\`页面服务器 \${pageId} 已清理\`)
    }
  }

  // 清理所有资源
  dispose() {
    // 清理所有服务器
    this.servers.forEach(server => {
      server.transport = null
    })
    this.servers.clear()

    if (this.mainServer) {
      this.mainServer.transport = null
    }

    this.mainServer = null
    this.router = null
    this.capabilities = null

    console.log('所有服务器资源已清理')
  }
}

// 全局实例
export const mcpServerManager = new McpServerManager()

// 页面级服务器 composable
export function usePageMcpServer(pageId: string, config?: PageServerConfig) {
  const server = mcpServerManager.getPageServer(pageId, config)

  // 连接服务器
  const connect = async (): Promise<boolean> => {
    // 已连接直接返回
    if (server?.transport) {
      console.log(\`页面服务器 \${pageId} 已经连接\`)
      return true
    }

    // 获取主服务器传输层并连接
    const transport = mcpServerManager.getMainServer()?.transport
    if (!transport) {
      console.warn(\`无法连接页面服务器 \${pageId}: 主服务器未连接\`)
      return false
    }

    try {
      await server!.connect(transport)
      server!.transport = transport
      console.log(\`页面服务器 \${pageId} 已连接\`)
      return true
    } catch (error) {
      console.error(\`页面服务器 \${pageId} 连接失败:\`, error)
      return false
    }
  }

  // 断开连接并清理页面服务器
  const disconnect = () => {
    if (server?.transport) {
      server.transport = null
      console.log(\`页面服务器 \${pageId} 已断开连接\`)
    }

    mcpServerManager.removePageServer(pageId)
  }

  return { server, connect, disconnect }
}`
}
