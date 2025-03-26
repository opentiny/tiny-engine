import { HOOK_NAME } from '@opentiny/tiny-engine-meta-register'
import useStyle from './useStyle'

export const StyleService = {
  id: 'engine.service.style',
  type: 'MetaService',
  apis: useStyle(),
  composable: {
    name: HOOK_NAME.useStyle
  }
}
