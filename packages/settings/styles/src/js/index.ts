import { HOOK_NAME, META_SERVICE, defineService } from '@opentiny/tiny-engine-meta-register'
import useStyle from './useStyle'

const { state, ...apis } = useStyle()

export default defineService({
  id: META_SERVICE.Style,
  type: 'MetaService',
  apis: () => apis,
  composable: {
    name: HOOK_NAME.useStyle
  },
  init: () => {
    apis.initStylePanelWatch()
  }
})
