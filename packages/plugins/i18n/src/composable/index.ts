import { HOOK_NAME } from '@opentiny/tiny-engine-meta-register'
import useTranslate from './useTranslate'
import { getAllI18n, getI18n, addI18n, updateI18n, delI18n } from './tools'

export const TranslateService = {
  id: 'engine.service.translate',
  type: 'MetaService',
  apis: useTranslate(),
  composable: {
    name: HOOK_NAME.useTranslate
  },
  aiTools: [getAllI18n, getI18n, addI18n, updateI18n, delI18n]
}
