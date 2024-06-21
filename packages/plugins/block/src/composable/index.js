import { HOOK_NAME } from '@opentiny/tiny-engine-entry'
import useBlock from './useBlock'

export const BlockService = {
  id: 'engine.service.block',
  type: 'MetaService',
  apis: useBlock(),
  composable: {
    name: HOOK_NAME.useBlock
  }
}
