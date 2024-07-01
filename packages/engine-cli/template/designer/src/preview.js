/**
 * Copyright (c) 2023 - present TinyEngine Authors.
 * Copyright (c) 2023 - present Huawei Cloud Computing Technologies Co., Ltd.
 *
 * Use of this source code is governed by an MIT-style license.
 *
 * THE OPEN SOURCE SOFTWARE IN THIS PRODUCT IS DISTRIBUTED IN THE HOPE THAT IT WILL BE USEFUL,
 * BUT WITHOUT ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS FOR
 * A PARTICULAR PURPOSE. SEE THE APPLICABLE LICENSES FOR MORE DETAILS.
 *
 */

import { initHook, HOOK_NAME, generateCodeService } from '@opentiny/tiny-engine'
import { initPreview } from '@opentiny/tiny-engine'
import 'virtual:svg-icons-register'
import '@opentiny/tiny-engine-theme'

const beforeAppCreate = () => {
  initHook(HOOK_NAME.useEnv, import.meta.env)
}

initPreview({
  registry: {
    root: {
      id: 'engine.root',
      metas: [generateCodeService]
    },
    config: { id: 'engine.config', theme: 'light' }
  },
  lifeCycles: {
    beforeAppCreate
  }
})
