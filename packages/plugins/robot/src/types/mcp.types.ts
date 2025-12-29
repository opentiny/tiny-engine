export interface ResponseToolCall {
  id: string
  function: {
    name: string
    arguments: string
  }
}

export interface McpTool {
  name: string
  description: string
  inputSchema?: {
    type: 'object'
    properties: Record<
      string,
      {
        type: string
        description: string
        [prop: string]: unknown
      }
    >
    [prop: string]: unknown
  }
  [prop: string]: unknown
}

export interface McpListToolsResponse {
  tools: Array<McpTool>
}

export interface NextServerInfoResult {
  device: {
    referer?: string
    ip?: string
    [prop: string]: unknown
  }
  type: string
}
