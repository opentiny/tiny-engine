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
import { configurators } from './configurators/'
import 'virtual:svg-icons-register'

async function startApp() {
  const registry = await import('../registry')
  const { init, initRouter } = await import('@opentiny/tiny-engine')
  const config = await import('../engine.config')

  const router = config.default.enableRouter
    ? initRouter() // 路由配置
    : null

  init({
    // 合并多个注册表
    registry: [registry.default],
    configurators,
    createAppSignal: ['global_service_init_finish'],
    router
  })
}

startApp()
