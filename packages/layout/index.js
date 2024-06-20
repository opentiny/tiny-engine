import component from './src/Main.vue'
import metaData from './meta'
import { LayoutService } from './src/composable'

export default {
  ...metaData,
  component,
  metas: [LayoutService],
}

export { LayoutService }
