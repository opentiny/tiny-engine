export default {
  id: 'engine.plugins.pagecontroller',
  title: '页面 JS',
  type: 'plugins',
  icon: 'plugin-icon-js',
  width: 600,
  widthResizable: true,
  options: {
    enableAICompletion: true,
    AIModel: {
      modelName: 'internvl3-14b',
      baseUrl: 'https://agent.opentiny.design/api/v1/ai',
      url: ''
    }
  },
  confirm: 'close' // 当点击插件栏切换或关闭前是否需要确认, 会调用插件中confirm值指定的方法，e.g. 此处指向 close方法，会调用插件的close方法执行确认逻辑
}
