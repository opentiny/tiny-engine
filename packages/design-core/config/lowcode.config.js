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

/**
 * @typedef {Object} LSPConfig
 * @prop {boolean} enable
 * @prop {string} url
 * @prop {number} [port]
 * @prop {string} [ns]
 * @prop {'wss'|'ws'} [protocol]
 * @prop {import('reconnecting-websocket').Options} options
 *
 * @typedef {Object} CanvasOptionsItem
 * @prop  {string[]} material
 * @prop  {string[]} scripts
 * @prop  {string[]} styles
 *
 * @typedef {{[x:string]:CanvasOptionsItem}} CanvasOptions
 *
 * @typedef {Object} Config
 * @prop {'light'|'dark'} theme
 * @prop {'paddlepaddle'} dslMode
 * @prop {string} delHost
 * @prop {string[]} toolbarOptions
 * @prop {string[]} pluginOptions
 * @prop {CanvasOptions} canvasOptions
 * @prop {string} platformHost
 * @prop {string} appHost
 * @prop {string} materialHost
 * @prop {number} platformId
 * @prop {number} defaultImportLayout
 * @prop {LSPConfig} lspConfig
 *
 */
/**
 * @type {Config}
 */
const config = {
  // 编辑器主题类型， 取值：dark暗色系，light浅色系, 对应的npm包名为：@opentiny/tiny-engine-theme-${theme}, 暗色主题名需要以dark开头
  theme: 'light',

  // 当前面板技术栈类型，DSL转义参数， 其取值有: PaddlePaddle ... (后续追加更多)
  dslMode: 'paddlepaddle',

  // DSL 代码转换的服务地址
  dslHost: '',

  // 工具栏配置: Array<string>类型，当前取值:
  toolbarOptions: [],

  // 插件栏配置：Array<string>类型，当前取值：
  pluginOptions: [],

  canvasOptions: {
    paddlepaddle: {
      material: ['http://localhost:8080/mock/bundle.json'],
      scripts: [],
      styles: ['http://localhost:8080/tiny-vue.css']
    }
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
  defaultImportLayout: 1,

  // 语言服务器设置
  lspConfig: {
    enable: true,
    url: 'localhost',
    port: 6000,
    ns: '/python',
    protocol: 'ws',
    options: {
      maxReconnectionDelay: 10000,
      minReconnectionDelay: 1000,
      reconnectionDelayGrowFactor: 1.3,
      connectionTimeout: 10000,
      maxRetries: Infinity,
      debug: true
    }
  }
}

export default config
