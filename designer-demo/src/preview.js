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
import { defineEntry } from '@opentiny/tiny-engine-meta-register'
import 'virtual:svg-icons-register'

async function startApp() {
  const { initHook, HOOK_NAME, META_SERVICE, initPreview } = await import('@opentiny/tiny-engine')
  const { HttpService } = await import('./composable')

  const beforeAppCreate = () => {
    initHook(HOOK_NAME.useEnv, import.meta.env)
  }

  const registry = {
    [META_SERVICE.Http]: HttpService,
    'engine.config': {
      id: 'engine.config',
      theme: 'light',
      material: ['/mock/bundle.json']
    }
  }

  defineEntry(registry)

  initPreview({
    registry,
    lifeCycles: {
      beforeAppCreate
    }
  })
}

startApp()
