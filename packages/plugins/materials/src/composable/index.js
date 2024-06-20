import { HOOK_NAME } from '@opentiny/tiny-engine-entry'
import useResource from './useResource'

export const ResourceService = {
  id: 'engine.service.resource',
  type: 'MetaService',
  apis: useResource(),
  composable: {
    name: HOOK_NAME.useResource
  }
}
