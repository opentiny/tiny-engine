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
    }
  }
}
