import { HOOK_NAME } from '@opentiny/tiny-engine-meta-register'
import useTranslate from './useTranslate'

export const TranslateService = {
  id: 'engine.service.translate',
  type: 'MetaService',
  apis: useTranslate(),
  composable: {
    name: HOOK_NAME.useTranslate
  }
}
