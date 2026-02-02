import { computed, ref } from 'vue'
import type { PluginInfo, PluginTool } from '@opentiny/tiny-robot'
import { getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'
import type { McpTool } from '../../types/mcp.types'
import type { RequestTool } from '../../types/chat.types'
import { getRobotServiceOptions } from '../../utils'
import { MCPHost } from '../../services/MCPHost'

const mcpHost = new MCPHost()

const defaultMcpIcon =
  'https://res.hc-cdn.com/lowcode-portal/1.1.80.20250515160330/assets/opentiny-tinyengine-logo-4f8a3801.svg'

enum PluginAddState {
  Added = 'added',
  Idle = 'idle',
  Loading = 'loading'
}

const ENGINE_MCP_SERVER: PluginInfo = {
  id: 'tiny-engine-mcp-server',
  name: 'Tiny Engine MCP 工具',
  icon: defaultMcpIcon,
  description: '使用TinyEngine设计器能力，如操作画布、编辑页面等',
  addState: PluginAddState.Added
}

const inUseMcpServers = ref<PluginInfo[]>([{ ...ENGINE_MCP_SERVER, enabled: true, expanded: true, tools: [] }])

const updateServerTools = (serverId: string, tools: PluginTool[]) => {
  const mcpServer = inUseMcpServers.value.find((item) => item.id === serverId)
  if (mcpServer) {
    mcpServer.tools = tools
    if (!mcpHost.getClient(serverId) && serverId === ENGINE_MCP_SERVER.id) {
      mcpHost.setClient(serverId, getMetaApi(META_SERVICE.McpService)?.getMcpClient())
    }
  }
}

const updateEngineTools = async () => {
  const tools: Array<{ name: string; description: string; status: string; title?: string }> =
    (await getMetaApi(META_SERVICE.McpService)?.getToolList?.()) || []
  const engineTools = tools.map((tool) => ({
    id: tool.name,
    name: tool.title ? `${tool.title} ${tool.name}` : tool.name,
    description: tool.description,
    enabled: tool.status === 'enabled'
  }))
  updateServerTools(ENGINE_MCP_SERVER.id, engineTools)
  return engineTools
}

const convertMCPToOpenAITools = (mcpTools: McpTool[]): RequestTool[] => {
  return mcpTools.map((tool: McpTool) => ({
    type: 'function',
    function: {
      name: tool.id || tool.name,
      description: tool.description || '',
      parameters: {
        type: 'object',
        properties: Object.fromEntries(
          Object.entries(tool.inputSchema?.properties || {}).map(([key, prop]: [string, any]) => [key, { ...prop }])
        ),
        required: tool.inputSchema?.required || []
      }
    }
  })) as RequestTool[]
}

const updateEngineServerToolStatus = (toolId: string, enabled: boolean) => {
  getMetaApi(META_SERVICE.McpService)?.updateTool?.(toolId, { enabled })
}

const updateEngineServer = (engineServer: PluginInfo, enabled: boolean) => {
  engineServer?.tools?.forEach((tool) => {
    tool.enabled = enabled
    updateEngineServerToolStatus(tool.id, enabled)
  })
}

const updateMcpServerToggle = async (server: PluginInfo, enabled: boolean) => {
  if (server.id === ENGINE_MCP_SERVER.id) {
    server.enabled = enabled
    return
  }
  const inuseServer = inUseMcpServers.value.find((s) => s.id === server.id)
  if (!inuseServer) {
    return
  }
  try {
    if (enabled) {
      const { tools } = await connectMcpServer(inuseServer) // eslint-disable-line
      inuseServer.tools = tools.map((tool) => ({ ...tool, enabled: true }))
    } else {
      await disconnectMcpServer(inuseServer.id) // eslint-disable-line
      inuseServer.tools = []
    }
    inuseServer.enabled = enabled
  } catch (error) {
    inuseServer.enabled = false
  }
}

const updateMcpServerStatus = async (server: PluginInfo, added: boolean) => {
  // 市场添加状态修改
  server.addState = added ? PluginAddState.Added : PluginAddState.Idle
  if (added) {
    const newServer: PluginInfo = {
      ...server,
      id: server.id || `mcp-server-${Date.now()}`,
      enabled: true,
      addState: PluginAddState.Added,
      expanded: false,
      tools: server.tools || []
    }
    inUseMcpServers.value.push(newServer)
    if (server.id === ENGINE_MCP_SERVER.id) {
      await updateEngineTools()
      updateEngineServer(newServer, added)
    }
  } else {
    const index = inUseMcpServers.value.findIndex((p) => p.id === server.id)
    if (index > -1) {
      updateEngineServer(inUseMcpServers.value[index], added)
      inUseMcpServers.value.splice(index, 1)
    }
  }
}

const updateMcpServerToolStatus = (currentServer: PluginInfo, toolId: string, enabled: boolean) => {
  const tool = currentServer.tools?.find((t: PluginTool) => t.id === toolId)
  if (tool) {
    tool.enabled = enabled
    if (currentServer.id === ENGINE_MCP_SERVER.id) {
      updateEngineServerToolStatus(toolId, enabled)
    }
  }
}

const updateCustomMcpServers = async () => {
  const mcpServersConfig = getRobotServiceOptions().mcpConfig?.mcpServers || {}
  if (!Object.keys(mcpServersConfig).length) return
  const customMcpServers = Object.entries(mcpServersConfig).map(([id, config]) => ({ id, ...config }))
  const logger = console

  customMcpServers.forEach((server) => {
    if (!['streamablehttp', 'sse'].includes(server.type?.toLowerCase()) || !server.url) {
      logger.error(`解析mcpServer: ${server.id} 配置失败，type/url字段缺失或有误.`)
      return
    }

    if (inUseMcpServers.value.find((s) => s.id === server.id)) {
      return
    }
    const newServer: PluginInfo = {
      id: server.id,
      name: server.name || server.id,
      icon: server.icon || defaultMcpIcon,
      description: server.description || '',
      enabled: false,
      addState: PluginAddState.Added,
      expanded: false,
      type: server.type,
      url: server.url,
      tools: []
    }
    inUseMcpServers.value.push(newServer)
  })
}

const connectMcpServer = (server: PluginInfo) => {
  return mcpHost.connectToServer({
    id: server.id,
    url: server.url,
    type: server.type
  })
}

const disconnectMcpServer = (serverId: string) => {
  return mcpHost.disconnect(serverId)
}

const refreshMcpServerTools = () => {
  updateEngineTools()
  updateCustomMcpServers()
}

const toolsMap = computed(() => {
  return inUseMcpServers.value
    .filter((server) => server.enabled)
    .reduce((acc, server) => {
      server.tools
        .filter((tool) => tool.enabled)
        .forEach((tool) => {
          acc[tool.id || tool.name] = {
            server: server.id,
            ...tool
          }
        })
      return acc
    }, {})
})

const callTool = async (toolId: string, args: Record<string, unknown>) => {
  return mcpHost.getClient(toolsMap.value[toolId]?.server)?.callTool({ name: toolId, arguments: args || {} }) || {}
}

const tools = computed(() => {
  return convertMCPToOpenAITools(
    inUseMcpServers.value
      .filter((server) => server.enabled)
      .map((server) => server.tools.filter((tool) => tool.enabled))
      .flat()
  )
})

const getLLMTools = async () => {
  const servers = inUseMcpServers.value.filter((server) => server.enabled && server.tools.length > 0)
  const tools = await Promise.all(
    servers.map(async (server) => {
      const enabledTools = server.tools?.filter((tool) => tool.enabled).map((tool) => tool.id || tool.name) || []
      const client = mcpHost.getClient(server.id)
      if (client) {
        const listToolResult: { tools: McpTool[] } = await client.listTools()
        return listToolResult.tools.filter((tool) => enabledTools.includes(tool.name))
      }
      return []
    })
  )

  return convertMCPToOpenAITools(tools.flat())
}

const isToolsEnabled = computed(() => tools.value.length > 0)

export default function useMcpServer() {
  return {
    inUseMcpServers,
    refreshMcpServerTools,
    updateMcpServerStatus,
    updateMcpServerToolStatus,
    updateMcpServerToggle,
    callTool,
    getLLMTools,
    isToolsEnabled
  }
}
