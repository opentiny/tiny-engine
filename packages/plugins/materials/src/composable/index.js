import { HOOK_NAME } from '@opentiny/tiny-engine-meta-register'
import useMaterial from './useMaterial'
import usePageBlockSchema from './usePageBlockSchema'

export const MaterialService = {
  id: 'engine.service.material',
  type: 'MetaService',
  apis: useMaterial(),
  composable: {
    name: HOOK_NAME.useMaterial
  }
}

export const PageBlockSchemaService = {
  id: 'engine.service.pageBlockSchema',
  type: 'MetaService',
  apis: usePageBlockSchema(),
  composable: {
    name: HOOK_NAME.usePageBlockSchema
  }
}
