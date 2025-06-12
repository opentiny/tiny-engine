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

import { GenerateCodeService, Breadcrumb, Media, Lang, HttpService } from '../../../re-export'

export default {
  root: {
    id: 'engine.root',
    metas: [HttpService, GenerateCodeService]
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
  toolbars: [Breadcrumb, Media, Lang]
}
