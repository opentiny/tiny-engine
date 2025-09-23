import { HOOK_NAME } from '@opentiny/tiny-engine-meta-register'
import useTranslate from './useTranslate'
import { delI18n, getI18n, saveI18n } from './tools'

export const TranslateService = {
  id: 'engine.service.translate',
  type: 'MetaService',
  apis: useTranslate(),
  composable: {
    name: HOOK_NAME.useTranslate
  },
  mcp: {
    tools: [saveI18n, delI18n, getI18n]
  }
}
