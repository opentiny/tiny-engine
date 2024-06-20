import { HOOK_NAME } from '@opentiny/tiny-engine-entry'
import usePage from './usePage'

export const PageService = {
  id: 'engine.service.page',
  type: 'MetaService',
  apis: usePage(),
  composable: {
    name: HOOK_NAME.usePage
  }
}
