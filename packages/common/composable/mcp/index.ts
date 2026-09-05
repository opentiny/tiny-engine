import { useMessage, defineService, META_SERVICE, getAllMergeMeta } from '@opentiny/tiny-engine-meta-register'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { createTransportPair, createStreamProxy } from '@opentiny/next'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { IState, ToolItem, ServerConnectionStatus, ResourceItem, ResourceTemplateItem } from './type'
import {
  registerTools,
  getToolList,
  getToolByName,
  removeTool,
  updateTool,
  type UpdateToolConfig,
  initRegisterTools
} from './toolUtils'
import { toRaw } from 'vue'
import {
  initRegisterResources,
  registerResources,
  getResourceList,
  getResourceByUri,
  removeResource,
  updateResource
} from './resources'
import { getBaseTools } from './baseTools'

export type { IState, ToolItem, UpdateToolConfig }

interface IOptions {
  agentServer: {
    url: string | null
    token: string | null
    connectToAgentServer: boolean
    reconnectAttempts?: number
    reconnectInterval?: number
  }
}

// 定义 MCP Server 的能力
const capabilities = {
  prompts: { listChanged: true },
  resources: { subscribe: true, listChanged: true },
  tools: { listChanged: true },
  completions: {},
  logging: {}
}

const initialState: IState = {
  mcpServer: {
    transport: null,
    capabilities
  },
  server: null,
  sessionID: '',
  remoteTransport: null,
  toolList: [],
  toolInstanceMap: new Map(),
  mcpClient: null,
  serverConnectionStatus: 'disconnected',
  resources: [],
  resourceTemplates: [],
  resourceInstanceMap: new Map()
}

const updateServerConnectionStatus = (state: IState, status: ServerConnectionStatus, error?: Error) => {
  state.serverConnectionStatus = status

  const { publish } = useMessage()
  publish({ topic: 'serverConnectionStatusChanged', data: { status, error } })
}

// 关闭 streamableHTTP 的 transport
const closeTransport = async (state: IState) => {
  if (!state.remoteTransport) {
    return
  }

  if (['disconnected', 'disconnecting'].includes(state.serverConnectionStatus)) {
    return
  }

  try {
    updateServerConnectionStatus(state, 'disconnecting')
    await state.remoteTransport.terminateSession()
    updateServerConnectionStatus(state, 'disconnected')
  } catch (error) {
    updateServerConnectionStatus(state, 'error', error as Error)
  }
}

const connectToRemoteServer = async (state: IState, options: IOptions, client: Client, attempts: number = 0) => {
  const {
    reconnectAttempts = 3,
    reconnectInterval = 1000,
    url = '',
    token = '',
    connectToAgentServer = false
  } = options.agentServer || {}

  if (['connected', 'connecting'].includes(state.serverConnectionStatus) || !connectToAgentServer) {
    return
  }

  if (!url) {
    throw new Error('agent server url is required')
  }

  const handleClose = () => closeTransport(state)

  try {
    window.removeEventListener('beforeunload', handleClose)
    updateServerConnectionStatus(state, 'connecting')
    const exitSessionId = sessionStorage.getItem('mcp-session-id') || ''

    // 把量子纠缠的 client 客户端通过 StreamableHTTP 代理传递给后端服务，创建孪生 client
    const { transport: streamTransport, sessionId } = await createStreamProxy({
      client,
      url,
      token: token || '',
      sessionId: exitSessionId
    })

    updateServerConnectionStatus(state, 'connected')

    sessionStorage.setItem('mcp-session-id', sessionId)

    state.sessionID = sessionId
    state.remoteTransport = streamTransport
    window.addEventListener('beforeunload', handleClose)
  } catch (error) {
    if (attempts < reconnectAttempts) {
      await new Promise((resolve) => setTimeout(resolve, reconnectInterval))
      await connectToRemoteServer(state, options, client, attempts + 1)
    } else {
      updateServerConnectionStatus(state, 'error', error as Error)
    }
  }
}

const reconnectToRemoteServer = async (state: IState, options: IOptions) => {
  await closeTransport(state)
  await connectToRemoteServer(state, options, state.mcpClient as Client)
}

const createStreamServerTransport = async (state: IState, options: IOptions) => {
  // 在非 iframe 嵌入的模式下，使用量子纠缠的 transport
  const [transport, clientTransport] = createTransportPair()

  state.mcpServer.transport = transport

  const capabilities = {
    roots: { listChanged: true },
    sampling: {}
  }
  const client = new Client({ name: 'tiny-engine-mcp-client', version: '1.0.0' }, { capabilities })

  await client.connect(clientTransport)

  state.mcpClient = client

  await connectToRemoteServer(state, options, client)
}

const createMcpServer = async (state: IState) => {
  const { transport, capabilities } = state.mcpServer

  if (!transport) {
    throw new Error('transport is not available')
  }

  const server = new McpServer(
    {
      name: 'tiny-engine-mcp-server',
      version: '1.0.0'
    },
    {
      capabilities
    }
  )

  initRegisterTools(state, server)

  initRegisterResources(state, server)

  await server.connect(toRaw(transport))

  state.server = server

  const { publish } = useMessage()

  publish({ topic: 'mcpServerCreated', data: server })
}

const collectTools = (state: IState) => {
  const allMetaData = getAllMergeMeta()
  const tools: ToolItem[] = []

  try {
    const baseTools = getBaseTools(state) as unknown as ToolItem[]
    tools.push(...baseTools)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('inject base tools failed', e)
  }

  allMetaData.forEach((meta) => {
    if (Array.isArray(meta.mcp?.tools)) {
      tools.push(...meta.mcp.tools)
    }
  })

  state.toolList = tools
}

// 收集所有 meta 中声明的 MCP 资源与模板
const collectResources = (state: IState) => {
  const allMetaData = getAllMergeMeta()
  const resources: ResourceItem[] = []
  const resourceTemplates: ResourceTemplateItem[] = []

  allMetaData.forEach((meta) => {
    if (meta && typeof meta === 'object' && Array.isArray(meta.mcp?.resources)) {
      resources.push(...meta.mcp.resources)
    }
    if (meta && typeof meta === 'object' && Array.isArray(meta.mcp?.resourceTemplates)) {
      resourceTemplates.push(...meta.mcp.resourceTemplates)
    }
  })

  // 将结果挂载在 state 上，供后续创建 server 时使用
  state.resources = resources
  state.resourceTemplates = resourceTemplates
}

// 移除未使用的 @ts-expect-error 注释
export default defineService<IState, IOptions>({
  id: META_SERVICE.McpService,
  type: 'MetaService',
  options: {
    agentServer: {
      url: null,
      token: null,
      connectToAgentServer: false
    }
  },
  initialState,
  init: async ({ state, options }) => {
    await createStreamServerTransport(state, options)

    // 收集所有注册表中的 tools
    collectTools(state)
    // 收集所有注册表中的 resources
    collectResources(state)
    // TODO: 支持 prompts
    // TODO: 支持 Elicitation

    // 创建 mcp server
    await createMcpServer(state)
  },
  apis: ({ state, options }) => ({
    getMcpServer: () => state.server,
    getMcpClient: () => state.mcpClient,
    getRemoteTransport: () => state.remoteTransport,
    connectToRemoteServer: () => connectToRemoteServer(state, options, state.mcpClient as Client),
    reconnectToRemoteServer: () => reconnectToRemoteServer(state, options),
    closeRemoteServer: () => closeTransport(state),
    getServerConnectionStatus: () => state.serverConnectionStatus,
    closeTransport: () => closeTransport(state),
    registerTools: (tools: ToolItem[]) => registerTools(state, tools),
    getToolList: () => getToolList(state),
    getToolByName: (name: string) => getToolByName(state, name),
    removeTool: (name: string) => removeTool(state, name),
    updateTool: (name: string, config?: UpdateToolConfig) => updateTool(state, name, config),
    // resources apis
    registerResources: (resources: ResourceItem[]) => registerResources(state, resources),
    getResourceList: () => getResourceList(state),
    getResourceByUri: (uri: string) => getResourceByUri(state, uri),
    removeResource: (uri: string) => removeResource(state, uri),
    updateResource: (uri: string, updates?: any) => updateResource(state, uri, updates)
  })
})
