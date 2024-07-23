import { HOOK_NAME } from '@opentiny/tiny-engine-meta-register'

import useApp from './useApp'

export { GenerateCodeService } from './generateCode'
export { default as globalService } from './defaultGlobalService'

export const AppService = {
  id: 'engine.service.app',
  type: 'MetaService',
  apis: useApp(),
  composable: {
    name: HOOK_NAME.useApp
  }
}
