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

import Breadcrumb from '@opentiny/tiny-engine-toolbar-breadcrumb'
import Fullscreen from '@opentiny/tiny-engine-toolbar-fullscreen'
import Lang from '@opentiny/tiny-engine-toolbar-lang'
import Checkinout from '@opentiny/tiny-engine-toolbar-checkinout'
import Logo from '@opentiny/tiny-engine-toolbar-logo'
import Media from '@opentiny/tiny-engine-toolbar-media'
import Redoundo from '@opentiny/tiny-engine-toolbar-redoundo'
import Save from '@opentiny/tiny-engine-toolbar-save'
import Clean from '@opentiny/tiny-engine-toolbar-clean'
import Preview from '@opentiny/tiny-engine-toolbar-preview'
import GenerateVue from '@opentiny/tiny-engine-toolbar-generate-vue'
import Refresh from '@opentiny/tiny-engine-toolbar-refresh'
import Collaboration from '@opentiny/tiny-engine-toolbar-collaboration'
import Setting from '@opentiny/tiny-engine-toolbar-setting'

import Materials from '@opentiny/tiny-engine-plugin-materials'
import Data from '@opentiny/tiny-engine-plugin-data'
import Script from '@opentiny/tiny-engine-plugin-script'
import Tree from '@opentiny/tiny-engine-plugin-tree'
import Help from '@opentiny/tiny-engine-plugin-help'
import Schema from '@opentiny/tiny-engine-plugin-schema'
import Page from '@opentiny/tiny-engine-plugin-page'
import I18n from '@opentiny/tiny-engine-plugin-i18n'
import Bridge from '@opentiny/tiny-engine-plugin-bridge'
import Block from '@opentiny/tiny-engine-plugin-block'
import Datasource from '@opentiny/tiny-engine-plugin-datasource'
import Robot from '@opentiny/tiny-engine-plugin-robot'

import Props from '@opentiny/tiny-engine-setting-props'
import Events from '@opentiny/tiny-engine-setting-events'
import Styles from '@opentiny/tiny-engine-setting-styles'

import '@opentiny/tiny-engine-theme'
import layout from '@opentiny/tiny-engine-layout'
import { CanvasContainer, CanvasFooter } from '@opentiny/tiny-engine-canvas'

export default {
  config: {
    id: 'engine.config',
    // TODO: 主题支持传入主题 package 或者是 url。
    theme: 'light',
    // 物料链接
    material: [],
    // 画布依赖的 script、styles 链接。TODO: 解耦后添加默认 tinyvue 的链接
    canvasDependencies: {
      styles: [],
      scripts: []
    },
    dslMode: 'Vue',
    platformId: 918,
    // TODO: 声明周期相关配置拆分到页面管理的配置项里面
    // 生命周期函数
    lifeCyclesOptions: {
      Angular: [
        '_constructor_',
        'ngOnInit',
        'ngOnChanges',
        'ngDoCheck',
        'ngAfterContentInit',
        'ngAfterContentChecked',
        'ngAfterViewInit',
        'ngAfterViewChecked',
        'ngOnDestroy'
      ],
      Vue: [
        'setup',
        'onBeforeMount',
        'onMounted',
        'onBeforeUpdate',
        'onUpdated',
        'onBeforeUnmount',
        'onUnmounted',
        'onErrorCaptured',
        'onActivated',
        'onDeactivated'
      ],
      HTML: [],
      React: [
        'componentWillMount',
        'componentDidMount',
        'componentWillReceiveProps',
        'shouldComponentUpdate',
        'componentWillUpdate',
        'componentDidUpdate',
        'componentWillUnmount'
      ]
    },

    // 生命周期使用提示
    lifeCycleTips: {
      Vue: '通过Vue解构出来的方法都可以在setup这里使用，比如watch、computed、watchEffect等'
    }
  },
  layout,
  toolbars: [
    Logo,
    Breadcrumb,
    Media,
    Collaboration,
    Clean,
    Refresh,
    Save,
    GenerateVue,
    Preview,
    Redoundo,
    Fullscreen,
    Checkinout,
    Setting,
    Lang
  ],
  plugins: [Materials, Tree, Page, Block, Datasource, Bridge, I18n, Script, Data, Schema, Help, Robot],
  settings: [Props, Styles, Events],
  canvas: { CanvasContainer, CanvasFooter }
}
