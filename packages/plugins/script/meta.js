export default {
  id: 'engine.plugins.pagecontroller',
  title: '页面 JS',
  type: 'plugins',
  icon: 'plugin-icon-js',
  align: 'top',
  confirm: 'close' // 当点击插件栏切换或关闭前是否需要确认, 会调用插件中confirm值指定的方法，e.g. 此处指向 close方法，会调用插件的close方法执行确认逻辑
}
