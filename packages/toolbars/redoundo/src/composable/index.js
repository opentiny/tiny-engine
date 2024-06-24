import { HOOK_NAME } from '@opentiny/tiny-engine-entry'
import useHistory from './useHistory'

export const HistoryService = {
  id: 'engine.service.history',
  type: 'MetaService',
  apis: useHistory(),
  composable: {
    name: HOOK_NAME.useHistory
  }
}
