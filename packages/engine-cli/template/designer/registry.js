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

import {
  Breadcrumb,
  Fullscreen,
  Lang,
  ViewSetting,
  Logo,
  Lock,
  Media,
  Redoundo,
  Save,
  Clean,
  Preview,
  GenerateCode,
  Refresh,
  Collaboration,
  Materials,
  State,
  Script,
  Tree,
  Help,
  Schema,
  Page,
  I18n,
  Bridge,
  Block,
  Datasource,
  Robot,
  Props,
  Events,
  Styles,
  Layout,
  Canvas,
  GenerateCodeService,
  GlobalService
} from '@opentiny/tiny-engine'
import engineConfig from './engine.config'
import { HttpService } from './src/composable'

export default {
  root: {
    id: 'engine.root',
    metas: [HttpService, GenerateCodeService, GlobalService] // GlobalService 依赖 HttpService，HttpService需要在前面处理
  },
  config: engineConfig,
  layout: {
    ...Layout,
    options: {
      ...Layout.options,
      isShowLine: true,
      isShowCollapse: true,
      toolbars: {
        left: ['engine.toolbars.breadcrumb', 'engine.toolbars.lock', 'engine.toolbars.logo'],
        center: ['engine.toolbars.media'],
        right: [
          ['engine.toolbars.redoundo', 'engine.toolbars.clean'],
          ['engine.toolbars.preview'],
          ['engine.toolbars.generate-code', 'engine.toolbars.save']
        ],
        collapse: [
          ['engine.toolbars.collaboration'],
          ['engine.toolbars.refresh', 'engine.toolbars.fullscreen'],
          ['engine.toolbars.lang'],
          ['engine.toolbars.viewSetting']
        ]
      }
    }
  },
  themes: [
    {
      id: 'engine.theme.light'
    },
    {
      id: 'engine.theme.dark'
    }
  ],
  toolbars: [
    Logo,
    Breadcrumb,
    Lock,
    Media,
    Redoundo,
    Collaboration,
    Clean,
    Preview,
    Refresh,
    GenerateCode,
    Save,
    Fullscreen,
    Lang,
    ViewSetting
  ],
  plugins: [
    Materials,
    Tree,
    Page,
    [Block, { options: { ...Block.options, mergeCategoriesAndGroups: true } }],
    Datasource,
    Bridge,
    I18n,
    Script,
    State,
    Schema,
    Help,
    Robot
  ],
  dsls: [{ id: 'engine.dsls.dslvue' }],
  settings: [Props, Styles, Events],
  canvas: Canvas
}
