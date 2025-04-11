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
import { defineEntry, tryGetAndDefineHotfixRegistry } from '@opentiny/tiny-engine-meta-register'
import { configurators } from './configurators/'
import registry from '../registry'

import 'virtual:svg-icons-register'

const fetchHotfixRegistry = async (url) => {
  const response = await import(/* @vite-ignore */ url)
  return response.default
}

async function startApp() {
  // 这里模拟临时的 hotfix 注册表，会根据配置的接口读取 registry并 执行 defineEntry，因为 overWrite 的逻辑需要提前读取
  const hotfixRegistry = (await tryGetAndDefineHotfixRegistry({ url: 'http://localhost:8090/hotfixRegistry.js', request: fetchHotfixRegistry })) || {}

  // 导入@opentiny/tiny-engine时，内部的依赖包也会逐个导入，可能会执行useComplie，此时需要templateHashMap。所以需要先执行一次defineEntry
  defineEntry(registry)
  // TODO: 问题一：提前引入 @opentiny/tiny-engine 的依赖，会导致覆盖失败？
  // TODO: 问题二：如果 registry 是异步的，会导致模板覆盖失败？
  // const registry = await import('../registry')
  const { init } = await import('@opentiny/tiny-engine')

  init({
    // TODO: 这里支持数组，传入多个注册表
    registry: [registry, hotfixRegistry],
    configurators,
    createAppSignal: ['global_service_init_finish']
  })
}

startApp()
