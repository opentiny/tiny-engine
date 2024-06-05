import component from './src/Main.vue'
import metaData from './meta'

export default {
  ...metaData,
  component,
  options: {
    onlyShowDefault: false,
    defaultTabId: 'engine.plugins.materials.component',
    children: [{ id: 'engine.plugins.materials.component' }, { id: 'engine.plugins.materials.block' }]
  }
}
