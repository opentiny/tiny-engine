export default {
  id: 'engine.toolbars.collaboration',
  type: 'toolbars',
  title: 'collaboration',
  options: {
    icon: {
      default: 'team-collaboration'
    },
    renderType: 'slot',
    collapsed: true
  },
  layoutConfig: {
    region: 'top',
    position: 'collapse',
    group: 1,
    order: 1
  }
}
