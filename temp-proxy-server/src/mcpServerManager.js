import StdioMCPServer from './stdioMcpServer.js';
import wsManager from './wsManager.js';

class MCPManager {
  tools = []
  // builtinTools = []
  logger = console
  constructor() {
    this.servers = new Map();
    // this.initBuiltinServer(new BuiltinMCPServer(this), true);
  }

  async $getBuiltinTools() {
    wsManager.sendWebSocketRequest({ type: 'get_builtin_tools' });
    // wsManager
    // console.log('$getBuiltinTools', tools)
    const wsConnections = wsManager.getWSConnections();
    console.log('wsConnections', wsConnections)
    return new Promise((resolve, reject) => {
      wsConnections[0].on('message', (message) => {
        const data = JSON.parse(message);
        console.log('message data', data)
        if (data.type === 'register_builtin_tools') {
          console.log('data.tools', data.tools)
          resolve(data.tools)
        }
      })
    })

    // return this.builtinTools || [];
  }
  // registerBuiltinTool(tools) {
  //   // this.tools.push(tool);
  //   this.builtinTools = tools;
  // }
  async $callBuiltinTool(toolName, toolCallId, arg_string) {
    wsManager.sendWebSocketRequest({ type: 'call_builtin_tool', toolName, toolCallId, arg_string });

    return new Promise((resolve, reject) => {
      wsManager.getWSConnections()[0].on('message', (message) => {
        const data = JSON.parse(message);
        console.log('message data', data)
        if (data.type === 'call_builtin_tool_response' && data.toolCallId === toolCallId) {
          data.content ? resolve(data.content) : reject(data.error)
        }
      })
    })
  }

  // enabled 为 true 时，会自动启动内置服务器, 并注册工具
  async initBuiltinServer(builtinMCPServer, enabled = true) {
    if (this.servers.get(builtinMCPServer.getServerName())) {
      return;
    }

    this.addOrUpdateServerDirectly(builtinMCPServer);
    if (enabled) {
      await builtinMCPServer.start();
      await this.registerTools(builtinMCPServer.getServerName());
    }
  }
  
  async registerTools(serverName) {
    const server = this.servers.get(serverName);
    if (!server) {
      throw new Error(`MCP server "${serverName}" not found.`);
    }

    const { tools } = await server.getTools();
    console.log('tools', tools);
    const toolRequests = (tools || []).map((tool) => this.convertToToolRequest(tool, serverName));

    for (const toolRequest of toolRequests) {
      this.tools.push(toolRequest);
    }
    
    return this.tools;
  }
  async getAllTools() {
    return this.tools.map(({ handler, ...rest }) => rest);
  }
  callToolByToolName(toolName, toolCallId, arg_string) {
    const tool = this.tools.find((tool) => tool.name === toolName);
    if (!tool) {
      throw new Error(`Tool "${toolName}" not found.`);
    }
    return tool.handler(arg_string, { toolCallId });
  }
  
  addOrUpdateServer(description) {
    const existingServer = this.servers.get(description.name);
    if (description.type === 'stdio') {
      const { name, command, args, env } = description;
      if (existingServer) {
        existingServer.update(command, args, env);
      } else {
        const newServer = new StdioMCPServer(name, command, args, env, this.logger);
        this.servers.set(name, newServer);
      }
    }
    // else if (description.type === 'sse') {
    //   const { name, serverHost } = description;
    //   if (existingServer) {
    //     existingServer.update(serverHost);
    //   } else {
    //     const newServer = new SSEMCPServer(name, serverHost, this.logger);
    //     this.servers.set(name, newServer);
    //   }
    // }
  }

  addOrUpdateServerDirectly(server) {
    this.servers.set(server.getServerName(), server);
  }
  
  callTool(
    serverName,
    toolName,
    toolCallId,
    arg_string,
  ) {
    const server = this.servers.get(serverName);

    if (!server) {
      throw new Error(`MCP server "${toolName}" not found.`);
    }

    return server.callTool(toolName, toolCallId, arg_string);
  }
  
  convertToToolRequest(tool, serverName) {
    const id = `mcp_${serverName}_${tool.name}`;

    return {
      id,
      name: id,
      providerName: serverName,
      parameters: tool.inputSchema,
      description: tool.description,
      handler: async (arg_string, options) => {
        try {
          const res = await this.callTool(serverName, tool.name, options?.toolCallId || '', arg_string);
          console.debug(`[MCP: ${serverName}] ${tool.name} called with ${arg_string}`);
          console.debug('Tool execution result:', res);
          return JSON.stringify(res);
        } catch (error) {
          console.error(`Error in tool handler for ${tool.name} on MCP server ${serverName}:`, error);
          throw error;
        }
      },
    };
  }
}

export default new MCPManager();
