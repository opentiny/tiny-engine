export default {
  id: 'engine.toolbars.redoundo',
  type: 'toolbars',
  title: 'redoundo',
  options: {
    icon: {
      undo: 'undo',
      redo: 'redo'
    },
    renderType: 'slot'
  },
  layoutConfig: {
    region: 'top',
    position: 'right',
    order: 2,
    group: 1
  }
}
