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

export default {
  // 编辑器主题类型， 取值：dark暗色系，light浅色系, 对应的npm包名为：@opentiny/tiny-engine-theme-${theme}, 暗色主题名需要以dark开头
  theme: 'light',

  // 当前面板技术栈类型，DSL转义参数， 其取值有: Angular、React、HTML、Vue、Flowchart
  dslMode: 'Vue',

  // DSL 代码转换的服务地址
  dslHost: '',

  // 工具栏配置: Array<string>类型，当前取值:
  toolbarOptions: [],

  // 插件栏配置：Array<string>类型，当前取值：
  pluginOptions: [],

  canvasOptions: {
    Angular: {},
    Vue: {
      material: ['/mock/bundle.json'],
      scripts: [],
      styles: ['/tiny-vue.css']
    },
    React: {},
    HTML: {},
    Flowchart: {}
  },

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

  // 设计器服务的host
  platformHost: '',

  // 发布应用host
  appHost: '',

  // 物料服务的host
  materialHost: '',

  // 当前 editor 实例绑定的设计器id
  platformId: 897,

  // 是否默认导入布局组件
  defaultImportLayout: 1
}
