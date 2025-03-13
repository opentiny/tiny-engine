import { HOOK_NAME } from '@opentiny/tiny-engine-meta-register'
import useHelp from './useHelp'

export const HelpService = {
  id: 'engine.service.help',
  type: 'MetaService',
  apis: useHelp(),
  composable: {
    name: HOOK_NAME.useHelp
  }
}
