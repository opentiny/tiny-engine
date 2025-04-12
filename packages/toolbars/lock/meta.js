export default {
  id: 'engine.toolbars.lock',
  title: 'lock',
  type: 'toolbars',
  options: {
    icon: {
      locked: 'locked',
      userLocked: 'user-locked',
      unlocked: 'unlocked'
    },
    renderType: 'icon'
  },
  layoutConfig: {
    region: 'top',
    position: 'left',
    order: 2
  }
}
