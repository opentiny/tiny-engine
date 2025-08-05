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

/* eslint-disable no-undef */

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
  ThemeSwitch,
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
  GlobalService,
  ThemeSwitchService,
  HttpService,
  McpService
} from './re-export'

window.__TINY_ENGINE_REMOVED_REGISTRY = {}

export default {
  root: {
    id: 'engine.root',
    metas: [HttpService, GenerateCodeService, GlobalService, ThemeSwitchService, McpService] // GlobalService 依赖 HttpService，HttpService需要在前面处理
  },
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
    platformId: 1,
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
    },
    themesList: [
      {
        id: 'engine.theme.light',
        text: '浅色主题',
        type: 'light',
        icon: 'light',
        oppositeTheme: 'dark'
      },
      {
        id: 'engine.theme.dark',
        text: '深色主题',
        type: 'dark',
        icon: 'dark',
        oppositeTheme: 'light'
      }
    ]
  },
  layout: __TINY_ENGINE_REMOVED_REGISTRY['engine.layout'] === false ? null : Layout,
  toolbars: [
    __TINY_ENGINE_REMOVED_REGISTRY['engine.toolbars.themeSwitch'] === false ? null : ThemeSwitch,
    __TINY_ENGINE_REMOVED_REGISTRY['engine.toolbars.logo'] === false ? null : Logo,
    __TINY_ENGINE_REMOVED_REGISTRY['engine.toolbars.breadcrumb'] === false ? null : Breadcrumb,
    __TINY_ENGINE_REMOVED_REGISTRY['engine.toolbars.lock'] === false ? null : Lock,
    __TINY_ENGINE_REMOVED_REGISTRY['engine.toolbars.media'] === false ? null : Media,
    __TINY_ENGINE_REMOVED_REGISTRY['engine.toolbars.redoundo'] === false ? null : Redoundo,
    __TINY_ENGINE_REMOVED_REGISTRY['engine.toolbars.collaboration'] === false ? null : Collaboration,
    __TINY_ENGINE_REMOVED_REGISTRY['engine.toolbars.clean'] === false ? null : Clean,
    __TINY_ENGINE_REMOVED_REGISTRY['engine.toolbars.preview'] === false ? null : Preview,
    __TINY_ENGINE_REMOVED_REGISTRY['engine.toolbars.refresh'] === false ? null : Refresh,
    __TINY_ENGINE_REMOVED_REGISTRY['engine.toolbars.generate-code'] === false ? null : GenerateCode,
    __TINY_ENGINE_REMOVED_REGISTRY['engine.toolbars.save'] === false ? null : Save,
    __TINY_ENGINE_REMOVED_REGISTRY['engine.toolbars.fullscreen'] === false ? null : Fullscreen,
    __TINY_ENGINE_REMOVED_REGISTRY['engine.toolbars.lang'] === false ? null : Lang,
    __TINY_ENGINE_REMOVED_REGISTRY['engine.toolbars.viewSetting'] === false ? null : ViewSetting
  ],
  plugins: [
    __TINY_ENGINE_REMOVED_REGISTRY['engine.plugins.materials'] === false ? null : Materials,
    __TINY_ENGINE_REMOVED_REGISTRY['engine.plugins.outlinetree'] === false ? null : Tree,
    __TINY_ENGINE_REMOVED_REGISTRY['engine.plugins.appmanage'] === false ? null : Page,
    __TINY_ENGINE_REMOVED_REGISTRY['engine.plugins.blockmanage'] === false ? null : Block,
    __TINY_ENGINE_REMOVED_REGISTRY['engine.plugins.collections'] === false ? null : Datasource,
    __TINY_ENGINE_REMOVED_REGISTRY['engine.plugins.bridge'] === false ? null : Bridge,
    __TINY_ENGINE_REMOVED_REGISTRY['engine.plugins.i18n'] === false ? null : I18n,
    __TINY_ENGINE_REMOVED_REGISTRY['engine.plugins.pagecontroller'] === false ? null : Script,
    __TINY_ENGINE_REMOVED_REGISTRY['engine.plugins.state'] === false ? null : State,
    __TINY_ENGINE_REMOVED_REGISTRY['engine.plugins.schema'] === false ? null : Schema,
    __TINY_ENGINE_REMOVED_REGISTRY['engine.plugins.editorhelp'] === false ? null : Help,
    __TINY_ENGINE_REMOVED_REGISTRY['engine.plugins.robot'] === false ? null : Robot
  ],
  settings: [
    __TINY_ENGINE_REMOVED_REGISTRY['engine.setting.props'] === false ? null : Props,
    __TINY_ENGINE_REMOVED_REGISTRY['engine.setting.styles'] === false ? null : Styles,
    __TINY_ENGINE_REMOVED_REGISTRY['engine.setting.event'] === false ? null : Events
  ],
  canvas: Canvas
}
