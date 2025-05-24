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
import { META_SERVICE, META_APP } from '@opentiny/tiny-engine-meta-register'
import engineConfig from './engine.config'
import { HttpService } from './src/composable'

export default {
  [META_SERVICE.Http]: HttpService,
  'engine.config': {
    ...engineConfig
  },
  // 调整插件顺序示例:
  [META_APP.Layout]: {
    options: {
      relativeLayoutConfig: {
        [META_APP.Page]: {
          insertBefore: META_APP.State
        },
        // 调整插件顺序
        [META_APP.OutlineTree]: {
          insertAfter: META_APP.Materials
        },
        // 调整插件上下位置
        [META_APP.Schema]: {
          insertBefore: META_APP.Help
        },
        // 调整工具栏顺序
        [META_APP.Save]: {
          insertAfter: META_APP.GenerateCode
        },
        // 支持切换组
        [META_APP.Lang]: {
          insertAfter: META_APP.ViewSetting
        }
      }
    }
  }
}
