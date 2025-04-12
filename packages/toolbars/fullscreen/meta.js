export default {
  id: 'engine.toolbars.fullscreen',
  type: 'toolbars',
  title: 'fullscreen',
  options: {
    icon: {
      fullScreen: 'full-screen',
      cancelFullScreen: 'cancel-full-screen'
    },
    renderType: 'icon',
    collapsed: true
  },
  layoutConfig: {
    region: 'top',
    position: 'collapse',
    group: 2,
    order: 2
  }
}
