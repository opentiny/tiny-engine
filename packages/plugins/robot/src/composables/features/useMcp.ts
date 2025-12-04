import { computed, ref } from 'vue'
import type { PluginInfo, PluginTool } from '@opentiny/tiny-robot'
import { getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'
import type { McpTool } from '../../types/mcp.types'
import type { RequestTool } from '../../types/chat.types'

const ENGINE_MCP_SERVER: PluginInfo = {
  id: 'tiny-engine-mcp-server',
  name: 'Tiny Engine MCP 工具',
  icon: 'https://res.hc-cdn.com/lowcode-portal/1.1.80.20250515160330/assets/opentiny-tinyengine-logo-4f8a3801.svg',
  description: '使用TinyEngine设计器能力，如操作画布、编辑页面等',
  added: true
}

const inUseMcpServers = ref<PluginInfo[]>([{ ...ENGINE_MCP_SERVER, enabled: true, expanded: true, tools: [] }])

const updateServerTools = (serverId: string, tools: PluginTool[]) => {
  const mcpServer = inUseMcpServers.value.find((item) => item.id === serverId)
  if (mcpServer) {
    mcpServer.tools = tools
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

const updateMcpServerStatus = async (server: PluginInfo, added: boolean) => {
  // 市场添加状态修改
  server.added = added
  if (added) {
    const newServer: PluginInfo = {
      ...server,
      id: server.id || `mcp-server-${Date.now()}`,
      enabled: true,
      added: true,
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

const refreshMcpServerTools = () => {
  updateEngineTools()
}

let llmTools: RequestTool[] | null = null

const listTools = async (): Promise<McpTool[]> => {
  const mcpTools = await getMetaApi(META_SERVICE.McpService)?.getMcpClient()?.listTools()
  return mcpTools?.tools || []
}

const callTool = async (toolId: string, args: Record<string, unknown>) =>
  getMetaApi(META_SERVICE.McpService)?.getMcpClient()?.callTool({ name: toolId, arguments: args }) || {}

const getLLMTools = async () => {
  const mcpTools = await getMetaApi(META_SERVICE.McpService)?.getMcpClient()?.listTools()
  llmTools = convertMCPToOpenAITools(mcpTools?.tools || [])
  return llmTools
}

export default function useMcpServer() {
  return {
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
