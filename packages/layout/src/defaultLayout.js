export default {
  plugins: {
    top: [
      'engine.plugins.materials',
      'engine.plugins.outlinetree',
      'engine.plugins.appmanage',
      'engine.plugins.blockmanage',
      'engine.plugins.collections',
      'engine.plugins.bridge',
      'engine.plugins.i18n',
      'engine.plugins.pagecontroller',
      'engine.plugins.state'
    ],
    bottom: ['engine.plugins.schema', 'engine.plugins.editorhelp', 'engine.plugins.robot']
  },
  settings: ['engine.setting.props', 'engine.setting.styles', 'engine.setting.event'],
  toolbars: {
    left: ['engine.toolbars.breadcrumb', 'engine.toolbars.lock', 'engine.toolbars.logo'],
    center: ['engine.toolbars.media'],
    right: [
      ['engine.toolbars.themeSwitch', 'engine.toolbars.redoundo', 'engine.toolbars.clean'],
      ['engine.toolbars.preview'],
      ['engine.toolbars.generate-code', 'engine.toolbars.save']
    ],
    collapse: [
      ['engine.toolbars.collaboration'],
      ['engine.toolbars.refresh', 'engine.toolbars.fullscreen'],
      ['engine.toolbars.lang'],
      ['engine.toolbars.viewSetting']
    ]
  }
}
