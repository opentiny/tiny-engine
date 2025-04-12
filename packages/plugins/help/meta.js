import HelpIcon from './src/HelpIcon.vue'

export default {
  id: 'engine.plugins.editorhelp',
  title: '帮助',
  type: 'plugins',
  icon: HelpIcon,
  align: 'leftBottom',
  layoutConfig: {
    region: 'left',
    position: 'bottom',
    order: 2
  }
}
