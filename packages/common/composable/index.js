import { HOOK_NAME } from '@opentiny/tiny-engine-meta-register'

import useApp from './useApp'
import useEditorInfo from './useEditorInfo'

export { GenerateCodeService } from './generateCode'

export const AppService = {
  id: 'engine.service.app',
  type: 'MetaService',
  apis: useApp(),
  composable: {
    name: HOOK_NAME.useApp
  }
}

export const EditorInfoService = {
  id: 'engine.service.editorInfo',
  type: 'MetaService',
  apis: useEditorInfo(),
  composable: {
    name: HOOK_NAME.useEditorInfo
  }
}
