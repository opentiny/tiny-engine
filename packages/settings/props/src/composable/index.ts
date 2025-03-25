import { HOOK_NAME } from '@opentiny/tiny-engine-meta-register'
import useProperties from './useProperties'
import useProperty from './useProperty'

export const PropertiesService = {
  id: 'engine.service.properties',
  type: 'MetaService',
  apis: useProperties(),
  composable: {
    name: HOOK_NAME.useProperties
  }
}

export const PropertyService = {
  id: 'engine.service.property',
  type: 'MetaService',
  apis: useProperty(),
  composable: {
    name: HOOK_NAME.useProperty
  }
}
