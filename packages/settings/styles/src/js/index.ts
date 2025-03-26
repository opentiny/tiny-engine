import { HOOK_NAME, META_SERVICE, defineService } from '@opentiny/tiny-engine-meta-register'
import useStyle from './useStyle'

export default defineService({
  id: META_SERVICE.Style,
  type: 'MetaService',
  apis: () => {
    const { state, ...apis } = useStyle()
    return apis
  },
  composable: {
    name: HOOK_NAME.useStyle
  },
  init: () => {
    useStyle().initStylePanelWatch()
  }
})
