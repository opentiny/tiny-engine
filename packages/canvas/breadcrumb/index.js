import { HOOK_NAME } from '@opentiny/tiny-engine-entry'
import CanvasBreadcrumb from './src/CanvasFooter.vue'
import metaData from './meta'
import useBreadcrumb from './src/useBreadcrumb'

export default {
  ...metaData,
  apis: useBreadcrumb(),
  entry: CanvasBreadcrumb,
  composable: {
    name: HOOK_NAME.useBreadcrumb
  }
}
