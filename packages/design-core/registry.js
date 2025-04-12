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
  HttpService
} from './re-export'

export default {
  root: {
    id: 'engine.root',
    metas: [HttpService, GenerateCodeService, GlobalService, ThemeSwitchService] // GlobalService 依赖 HttpService，HttpService需要在前面处理
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
  layout: Layout,
  toolbars: [
    ThemeSwitch,
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
  settings: [Props, Styles, Events],
  canvas: Canvas
}
