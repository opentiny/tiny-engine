import { HOOK_NAME } from '@opentiny/tiny-engine-meta-register'
import useLayout from './useLayout'

export const LayoutService = {
  id: 'engine.service.layout',
  type: 'MetaService',
  apis: useLayout(),
  composable: {
    name: HOOK_NAME.useLayout
  }
}
