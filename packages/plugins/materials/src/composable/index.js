import { HOOK_NAME } from '@opentiny/tiny-engine-meta-register'
import useResource from './useResource'
import useMaterial from './useMaterial'

export const ResourceService = {
  id: 'engine.service.resource',
  type: 'MetaService',
  apis: useResource(),
  composable: {
    name: HOOK_NAME.useResource
  }
}

export const MaterialService = {
  id: 'engine.service.material',
  type: 'MetaService',
  apis: useMaterial(),
  composable: {
    name: HOOK_NAME.useMaterial
  }
}
