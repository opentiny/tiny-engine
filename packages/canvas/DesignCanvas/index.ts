import { HOOK_NAME } from '@opentiny/tiny-engine-meta-register'
import DesignCanvas from './src/DesignCanvas.vue'
import metaData from './meta'
import api from './src/api'
export default {
  ...metaData,
  entry: DesignCanvas,
  apis: api(),
  composable: {
    name: HOOK_NAME.useCanvas
  }
}
