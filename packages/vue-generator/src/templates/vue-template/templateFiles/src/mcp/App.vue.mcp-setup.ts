export default (schema, options) => {
  const { capabilities } = options

  return `

const [serverTransport, clientTransport] = createMessageChannelPairTransport();

// 定义 MCP Server 的能力
const capabilities = ${JSON.stringify(capabilities, null, 2)};

const mcpServer: {
  transport: Transport | null;
  capabilities: Record<string, any>;
} = {
  transport: serverTransport,
  capabilities,
};

provide("mcpServer", mcpServer);

serverTransport.onerror = (error) => {
  console.error(\`ServerTransport error:\`, error);
};

const createProxyTransport = async () => {
  const client = new WebMcpClient(
    { name: "mcp-web-client", version: "1.0.0" },
    {
      capabilities: {
        roots: { listChanged: true },
        sampling: {},
        elicitation: {},
      },
    }
  );
  // @ts-expect-error client
  window.client = client;
  await client.connect(clientTransport);

  await client.connect({
    url: AGENT_ROOT + "mcp",
    sessionId: SESSION_ID,
    agent: true,
    onError: (error: Error) => {
      console.error("Connect proxy error:", error);
    },
  });

  window.addEventListener("pagehide", client.onPagehide);
};

// 初始化MCP服务器管理器
const initMcpServer = async () => {
  try {
    // 初始化管理器
    mcpServerManager.init(router, mcpServer);
    // 连接所有服务器
    await mcpServerManager.connectAll(mcpServer.transport as Transport);
    console.log('MCP 服务器管理器初始化成功');
  } catch (error) {
    console.error('MCP 服务器管理器初始化失败:', error);
  }
};`
}
