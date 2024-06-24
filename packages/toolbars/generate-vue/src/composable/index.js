import { HOOK_NAME } from '@opentiny/tiny-engine-entry'
import useSaveLocal from './useSaveLocal'

export const SaveLocalService = {
  id: 'engine.service.savelocal',
  type: 'MetaService',
  apis: useSaveLocal(),
  composable: {
    name: HOOK_NAME.useSaveLocal
  }
}
