import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

class StdioMCPServer {
  name;
  command;
  args;
  client;
  env;
  started = false;
  logger = console
  constructor(
    name,
    command,
    args,
    env,
    logger = console,
  ) {
    this.name = name;
    this.command = command;
    this.args = args;
    this.env = env;
    this.logger = logger;
  }
  isStarted() {
    return this.started;
  }

  getServerName() {
    return this.name;
  }

  async start() {
    if (this.started) {
      return;
    }
    this.logger?.log(
      `Starting server "${this.name}" with command: ${this.command} and args: ${this.args?.join(
        ' ',
      )} and env: ${JSON.stringify(this.env)}`,
    );
    // Filter process.env to exclude undefined values
    const sanitizedEnv = Object.fromEntries(
      Object.entries(process.env).filter((entry) => entry[1] !== undefined),
    );

    const mergedEnv = {
      ...sanitizedEnv,
      ...(this.env || {}),
    };

    const transport = new StdioClientTransport({
      command: this.command,
      args: this.args,
      env: mergedEnv,
    });
    transport.onerror = (error) => {
      this.logger?.error('Transport Error:', error);
    };

    this.client = new Client(
      {
        name: 'sumi-ide-stdio-mcp-client',
        version: '1.0.0',
      },
      {
        capabilities: {},
      },
    );
    this.client.onerror = (error) => {
      this.logger?.error('Error in MCP client:', error);
    };

    await this.client.connect(transport);
    this.started = true;
  }

  async callTool(toolName, toolCallId, arg_string) {
    let args;
    try {
      args = JSON.parse(arg_string);
    } catch (error) {
      this.logger?.error(
        `Failed to parse arguments for calling tool "${toolName}" in MCP server "${this.name}" with command "${this.command}".
                Invalid JSON: ${arg_string}`,
        error,
      );
    }
    const params = {
      name: toolName,
      arguments: args,
      toolCallId,
    };
    return this.client.callTool(params);
  }

  async getTools() {
    return await this.client.listTools();
  }

  update(command, args, env) {
    this.command = command;
    this.args = args;
    this.env = env;
  }

  async stop() {
    if (!this.started || !this.client) {
      return;
    }
    this.logger?.log(`Stopping MCP server "${this.name}"`);
    try {
      await this.client.close();
    } catch (error) {
      this.logger?.error(`Failed to stop MCP server "${this.name}":`, error);
    }
    this.logger?.log(`MCP server "${this.name}" stopped`);
    this.started = false;
  }
}

export default StdioMCPServer;
