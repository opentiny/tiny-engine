export const BUILTIN_MCP_SERVER_NAME = 'Builtin';

export default class BuiltinMCPServer {
  started = false;
  logger = console
  constructor(mcpServerManager, logger = console) {
    this.mcpServerManager = mcpServerManager;
  }

  isStarted() {
    return this.started;
  }

  getServerName() {
    return BUILTIN_MCP_SERVER_NAME;
  }

  async start() {
    if (this.started) {
      return;
    }
    // TODO 考虑 MCP Server 的对外暴露
    // await this.sumiMCPServer.initMCPServer();
    this.started = true;
  }

  async callTool(toolName, toolCallId, arg_string) {
    if (!this.started) {
      throw new Error('MCP Server not started');
    }
    let args;
    try {
      args = JSON.parse(arg_string);
    } catch (error) {
      this.logger.error(
        `Failed to parse arguments for calling tool "${toolName}" in Builtin MCP server.
        Invalid JSON: ${arg_string}`,
        error,
      );
      throw error;
    }
    // TODO: 这里向前端通知工具调用，并返回调用结果
    // return this.sumiMCPServer.callMCPTool(toolName, {
    //   ...args,
    //   toolCallId,
    // });
    const res = await this.mcpServerManager.$callBuiltinTool(toolName, toolCallId, arg_string);
    return res;
  }

  async getTools() {
    if (!this.started) {
      throw new Error('MCP Server not started');
    }
    // TODO: 这里向前端拿工具列表
    // const tools = await this.sumiMCPServer.$getMCPTools();
    // const tools = await wsConnections[0].send(JSON.stringify({ type: 'get_builtin_tools' }));
    const tools = await this.mcpServerManager.$getBuiltinTools();
    return { tools };
  }

  update(_command, _args, _env) {
    // No-op for builtin server as it doesn't need command/args/env updates
  }

  stop() {
    if (!this.started) {
      return;
    }
    // No explicit cleanup needed for in-memory server
    this.started = false;
  }
}