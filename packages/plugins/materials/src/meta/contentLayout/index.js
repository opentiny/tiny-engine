import component from './src/Main.vue'
import metaData from './meta'

export default {
  ...metaData,
  component,
  options: {
    onlyShowDefault: false,
    defaultTabId: 'engine.plugins.materials.component',
    childrenIds: ['engine.plugins.materials.component', 'engine.plugins.materials.block']
  }
}
