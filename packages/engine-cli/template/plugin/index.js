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

import entry from './src/Main.vue'
import metaData from './meta.js'

// 插件元服务，即用户可以通过注册表拿到该元服务，得到插件的核心元服务
import { PluginDemoService } from './src/composable'

export default {
  ...metaData,
  // 插件暴露的 api，可以提供其他 api 进行调用，如果无需暴露，可为空
  apis: {},
  // 插件的 UI 渲染入口
  entry,
  metas: [PluginDemoService]
}

export { PluginDemoService }
