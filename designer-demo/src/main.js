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

// 导入@opentiny/tiny-engine时，内部的依赖包也会逐个导入，可能会执行useComplie，此时需要templateHashMap。所以需要先执行一次defineEntry
import { registry } from './defineEntry.js'
import { init } from '@opentiny/tiny-engine'
import { initHook, HOOK_NAME } from '@opentiny/tiny-engine-entry'
import { configurators } from './configurators.js'
import 'virtual:svg-icons-register'
import '@opentiny/tiny-engine-theme'

const beforeAppCreate = () => {
  initHook(HOOK_NAME.useEnv, import.meta.env)
}

init({ registry, configurators, lifeCycles: { beforeAppCreate } })
