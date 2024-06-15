import component from './src/Main.vue'
import metaData from './meta'
import useLayout from './src/hooks/useLayout'
import { HOOK_NAME } from '@opentiny/tiny-engine-entry'

export default {
  ...metaData,
  component,
  apis: useLayout(),
  composable: {
    name: HOOK_NAME.useLayout
  }
}
