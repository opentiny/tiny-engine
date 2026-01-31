export default {
  id: 'engine.toolbars.robot',
  type: 'toolbars',
  title: 'robot',
  options: {
    icon: {
      default: 'AI'
    },
    renderType: 'icon',
    customCompatibleAIModels: [], // 模型配置
    enableResourceContext: true, // 提示词上下文携带资源插件图片
    enableRagContext: false, // 提示词上下文携带查询到的知识库内容
    encryptServiceApiKey: false, // 是否加密服务API密钥
    modeImplementation: {
      // 支持通过注册表传入chat和agent模式的实现
      // chat: useCustomChatMode
      // agent: useCustomAgentMode
    },
    mcpConfig: {
      mcpServers: {
        // 支持添加自定义MCP Server服务器
        // 'img-search': { // MCP 服务器 id, 使用英文
        //   type: 'SSE', // 支持 SSE 和 StreamableHttp 两种类型
        //   name: '自定义MCP服务器',  // 显示名称
        //   description: 'xxx', // 描述信息
        //   icon: 'https://xxx', // 自定义图标
        //   url: 'https://xxxx/mcp' // 自定义MCP Server地址
        // }
      }
    }
  }
}
