/**
 * Copyright (c) 2024 - present TinyEngine Authors.
 * Copyright (c) 2024 - present Huawei Cloud Computing Technologies Co., Ltd.
 *
 * Use of this source code is governed by an MIT-style license.
 *
 * THE OPEN SOURCE SOFTWARE IN THIS PRODUCT IS DISTRIBUTED IN THE HOPE THAT IT WILL BE USEFUL,
 * BUT WITHOUT ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS FOR
 * A PARTICULAR PURPOSE. SEE THE APPLICABLE LICENSES FOR MORE DETAILS.
 *
 */
import { META_SERVICE } from '@opentiny/tiny-engine-meta-register'
import engineConfig from './engine.config'
import { HttpService } from './src/composable'
import scriptPlugin from './src/plugins/script'

export default {
  [META_SERVICE.Http]: HttpService,
  'engine.config': {
    ...engineConfig
  },
  // 配置 false 隐藏工具栏清空按钮
  'engine.toolbars.clean': false,
  // 配置 false 隐藏大纲树，手动配置 tree-shaking 为 false，仍然不会被 tree-shaking
  // #__TINY_ENGINE_TREE_SHAKING__: false
  'engine.plugins.outlinetree': false,
  // 替换整个页面JS插件，手动配置 tree-shaking 为 true
  /* #__TINY_ENGINE_TREE_SHAKING__: true */
  'engine.plugins.pagecontroller': scriptPlugin,
  // 换了个id，代表新增模块
  'engine.plugins.script': {
    ...scriptPlugin,
    id: 'engine.plugins.script'
  },
  'engine.layout': {
    options: {
      relativeLayoutConfig: {
        'engine.plugins.script': {
          insertBefore: 'engine.plugins.appmanage'
        },
        // 调整插件顺序
        'engine.plugins.materials': {
          insertAfter: 'engine.plugins.state'
        },
        // 调整插件上下位置
        'engine.plugins.schema': {
          insertBefore: 'engine.plugins.materials'
        },
        // 调整工具栏顺序
        'engine.toolbars.save': {
          insertBefore: 'engine.toolbars.themeSwitch'
        },
        // 支持切换组
        'engine.toolbars.lang': {
          insertAfter: 'engine.toolbars.breadcrumb'
        }
      }
    }
  }
}
