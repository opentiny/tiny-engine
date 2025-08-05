import { computed, ref } from 'vue'
import type { PluginInfo, PluginTool } from '@opentiny/tiny-robot'
import { getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'
import type { McpListToolsResponse, McpTool, RequestTool } from './types'

const ENGINE_MCP_SERVER: PluginInfo = {
  id: 'tiny-engine-mcp-server',
  name: 'Tiny Engine MCP 服务器',
  icon: 'https://res.hc-cdn.com/lowcode-portal/1.1.80.20250515160330/assets/opentiny-tinyengine-logo-4f8a3801.svg',
  description: '使用TinyEngine设计器能力，如添加国际化',
  added: true
}

const MOCK_SERVERS: PluginInfo[] = [
  {
    id: 'plugin-1',
    name: 'Jira 集成 (Mock)',
    icon: 'https://ts3.tc.mm.bing.net/th/id/ODLS.2a97aa8b-50c6-4e00-af97-3b563dfa07f4',
    description: 'Jira 任务管理',
    enabled: true,
    added: false,
    tools: [
      { id: 'tool-5', name: '创建任务', description: '创建 Jira 任务', enabled: true },
      { id: 'tool-6', name: '查询任务', description: '查询 Jira 任务', enabled: true }
    ]
  },
  {
    id: 'plugin-2',
    name: 'Notion 集成 (Mock)',
    icon: 'https://www.notion.so/front-static/favicon.ico',
    description: 'Notion 文档管理和协作',
    enabled: false,
    added: false,
    tools: [
      { id: 'tool-7', name: '创建页面', description: '创建 Notion 页面', enabled: false },
      { id: 'tool-8', name: '查询数据库', description: '查询 Notion 数据库', enabled: false }
    ]
  },
  {
    id: 'plugin-3',
    name: 'Telegram 机器人 (Mock)',
    icon: 'https://telegram.org/favicon.ico',
    description: 'Telegram 消息推送和自动化',
    enabled: false,
    added: false,
    tools: [{ id: 'tool-9', name: '发送消息', description: '发送 Telegram 消息', enabled: false }]
  }
]

const mcpServers = ref<PluginInfo[]>([ENGINE_MCP_SERVER, ...MOCK_SERVERS])

const inUseMcpServers = ref<PluginInfo[]>([
  { ...ENGINE_MCP_SERVER, enabled: true, expanded: false, tools: [], toolCount: 0 }
])

const updateServerTools = (serverId: string, tools: PluginTool[]) => {
  const mcpServer = inUseMcpServers.value.find((item) => item.id === serverId)
  if (mcpServer) {
    mcpServer.tools = tools
    mcpServer.toolCount = tools.length
  }
}

const updateEngineTools = async () => {
  const tools: Array<{ name: string; description: string; status: string }> =
    (await getMetaApi(META_SERVICE.McpService)?.getToolList?.()) || []
  const engineTools = tools.map((tool) => ({
    id: tool.name,
    name: tool.name,
    description: tool.description,
    enabled: tool.status === 'enabled'
  }))
  updateServerTools(ENGINE_MCP_SERVER.id, engineTools)
}

const convertMCPToOpenAITools = (mcpTools: McpTool[]): RequestTool[] => {
  return mcpTools.map((tool: McpTool) => ({
    type: 'function',
    function: {
      name: tool.name,
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

const getEngineServer = () => {
  return inUseMcpServers.value.find((item) => item.id === ENGINE_MCP_SERVER.id)
}

const isToolsEnabled = computed(() => getEngineServer()?.tools?.some((tool) => tool.enabled))

const updateEngineServerToolStatus = (toolId: string, enabled: boolean) => {
  getMetaApi(META_SERVICE.McpService)?.updateTool?.(toolId, { enabled })
}

const updateEngineServer = (engineServer: PluginInfo, enabled: boolean) => {
  engineServer?.tools?.forEach((tool) => {
    tool.enabled = enabled
    updateEngineServerToolStatus(tool.id, enabled)
  })
}

// TODO: 连接MCP Server
const connectMcpServer = (_server: PluginInfo) => {}

// TODO: 断开连接
const disconnectMcpServer = (_server: PluginInfo) => {}

const updateMcpServerStatus = async (server: PluginInfo, added: boolean) => {
  if (added) {
    const newServer: PluginInfo = {
      ...server,
      id: server.id || `mcp-server-${Date.now()}`,
      enabled: true,
      added: true,
      expanded: false,
      tools: server.tools || [],
      toolCount: server.tools?.length || 0
    }
    inUseMcpServers.value.push(newServer)
    if (server.id === ENGINE_MCP_SERVER.id) {
      await updateEngineTools()
      updateEngineServer(newServer, added)
    }
    // TODO: 连接MCP Server
    connectMcpServer(newServer)
  } else {
    const index = inUseMcpServers.value.findIndex((p) => p.id === server.id)
    if (index > -1) {
      updateEngineServer(inUseMcpServers.value[index], added)
      inUseMcpServers.value.splice(index, 1)
      // TODO: 断开连接
      disconnectMcpServer(server)
    }
  }
}

const updateMcpServerToolStatus = (currentServer: PluginInfo, toolId: string, enabled: boolean) => {
  const tool = currentServer.tools?.find((t: PluginTool) => t.id === toolId)
  if (tool) {
    tool.enabled = enabled
    if (currentServer.id === ENGINE_MCP_SERVER.id) {
      updateEngineServerToolStatus(toolId, enabled)
    } else {
      // TODO: 更新MCP Server的Tool状态
      // 获取 tool 实例调用 enableTool 或 disableTool
    }
  }
}

const refreshMcpServerTools = () => {
  updateEngineTools()
}

const listTools = async (): Promise<McpListToolsResponse> =>
  getMetaApi(META_SERVICE.McpService)?.getMcpClient()?.listTools()

const callTool = async (toolId: string, args: Record<string, unknown>) =>
  getMetaApi(META_SERVICE.McpService)?.getMcpClient()?.callTool({ name: toolId, arguments: args }) || {}

const getLLMTools = async () => {
  const mcpTools = await listTools()
  return convertMCPToOpenAITools(mcpTools?.tools || [])
}

export default function useMcpServer() {
  return {
    mcpServers,
    inUseMcpServers,
    refreshMcpServerTools,
    updateMcpServerStatus,
    updateMcpServerToolStatus,
    listTools,
    callTool,
    getLLMTools,
    isToolsEnabled
  }
}
