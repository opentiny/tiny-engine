import { HOOK_NAME } from '@opentiny/tiny-engine-meta-register'
import useTranslate from './useTranslate'
import { addI18n, delI18n, updateI18n, getI18n } from './tools'

export const TranslateService = {
  id: 'engine.service.translate',
  type: 'MetaService',
  apis: useTranslate(),
  composable: {
    name: HOOK_NAME.useTranslate
  },
  mcp: {
    tools: [addI18n, delI18n, updateI18n, getI18n]
  }
}
