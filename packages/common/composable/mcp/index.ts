import { useMessage, defineService, META_SERVICE, getAllMergeMeta } from '@opentiny/tiny-engine-meta-register'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { createTransportPair, createStreamProxy } from '@opentiny/next'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.d.ts'
import type { ZodRawShape } from 'zod'
import type { IState, ToolItem, ServerConnectionStatus } from './type'
import { registerTools, getToolList, getToolByName, removeTool, updateTool, type UpdateToolConfig } from './toolUtils'
import { toRaw } from 'vue'

const logger = console

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
  serverConnectionStatus: 'disconnected'
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

  // server._setupTimeout = () => {}

  state.toolList.forEach((tool) => {
    const { name, callback, inputSchema, outputSchema, ...restConfig } = tool

    try {
      if (state.toolInstanceMap.has(name)) {
        logger.error(`tool ${name} already registered`)
        return
      }

      if (!name || typeof name !== 'string') {
        logger.error('tool name is required and must be a string')
        return
      }

      if (!callback || typeof callback !== 'function') {
        logger.error('tool callback is required and must be a function')
        return
      }

      const toolInstance = server.registerTool(
        name,
        // 需要序列化一次，否则 list tool 会超时，因为有 proxy 之后，内部会报错
        {
          ...JSON.parse(JSON.stringify(restConfig)),
          inputSchema,
          outputSchema
        },
        callback as ToolCallback<ZodRawShape>
      )

      state.toolInstanceMap.set(name, toolInstance)
    } catch (error) {
      logger.error('error when register tool', error)
    }
  })

  await server.connect(toRaw(transport))

  state.server = server

  const { publish } = useMessage()

  publish({ topic: 'mcpServerCreated', data: server })
}

const collectTools = (state: IState) => {
  const allMetaData = getAllMergeMeta()
  const tools: ToolItem[] = []

  allMetaData.forEach((meta) => {
    if (Array.isArray(meta.mcp?.tools)) {
      tools.push(...meta.mcp.tools)
    }
  })

  state.toolList = tools
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
    // TODO: 支持 prompts
    // TODO: 支持 resources
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
    updateTool: (name: string, config?: UpdateToolConfig) => updateTool(state, name, config)
  })
})
