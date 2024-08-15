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

import { reactive, nextTick } from 'vue'
import { constants } from '@opentiny/tiny-engine-utils'
import { useStorage } from '@vueuse/core'

const { PAGE_STATUS } = constants

const PLUGIN_NAME = {
  Materials: 'Materials',
  AppManage: 'AppManage',
  BlockManage: 'BlockManage',
  PageController: 'PageController',
  Lock: 'Lock',
  Tutorial: 'Tutorial',
  OutlineTree: 'OutlineTree',
  save: 'save',
  Page: 'AppManage',
  Block: 'BlockManage',
  Datasource: 'Collections',
  Bridge: 'Bridge',
  I18n: 'I18n',
  Script: 'PageController',
  Data: 'DataSource',
  Schema: 'Schema',
  Event: 'SettingEvents',
  Style: 'SettingStyles',
  Props: 'SettingProps'
}

const pluginWidth = {
  Materials: 300,
  OutlineTree: 300,
  AppManage: 300,
  BlockManage: 300,
  Collections: 300,
  Bridge: 300,
  I18n: 620,
  PageController: 1000,
  DataSource: 300,
  Schema: 1000,
  SettingProps: 320,
  SettingStyles: 320,
  SettingEvents: 32
}
const pluginWidthStorage = useStorage('pluginWidth', pluginWidth)
const getPluginWidth = (name) => {
  return pluginWidthStorage.value[name]
}
const changePluginWidth = (name, width) => {
  if (Object.prototype.hasOwnProperty.call(pluginWidthStorage.value, name)) {
    pluginWidthStorage.value[name] = width
  }
}

const pluginState = reactive({
  pluginEvent: 'all'
})

const layoutState = reactive({
  deviceType: 'desktop',
  iframeWidth: '1200px',
  dimension: {
    deviceType: 'desktop',
    width: '',
    maxWidth: '',
    minWidth: '',
    scale: 1,
    height: '100%'
  },
  plugins: {
    fixedPanels: [PLUGIN_NAME.Materials],
    render: null,
    api: {}, // 插件需要注册交互API到这里
    activating: false, // 右侧面版激活提示状态
    showDesignSettings: true
  },
  settings: {
    fixedPanels: [],
    render: null,
    api: null,
    activating: false, // 右侧面版激活提示状态
    showDesignSettings: true
  },
  toolbars: {
    visiblePopover: false
  },
  pageStatus: ''
})
const leftFixedPanelsStorage = useStorage('leftFixedPanels', layoutState.plugins.fixedPanels)
const rightFixedPanelsStorage = useStorage('rightFixedPanels', layoutState.settings.fixedPanels)

const changeLeftFixedPanels = (pluginName) => {
  leftFixedPanelsStorage.value = leftFixedPanelsStorage.value?.includes(pluginName)
    ? leftFixedPanelsStorage.value?.filter((item) => item !== pluginName)
    : [...leftFixedPanelsStorage.value, pluginName]
}
const changeRightFixedPanels = (pluginName) => {
  rightFixedPanelsStorage.value = rightFixedPanelsStorage.value?.includes(pluginName)
    ? rightFixedPanelsStorage.value?.filter((item) => item !== pluginName)
    : [...rightFixedPanelsStorage.value, pluginName]
}
const registerPluginApi = (api) => {
  Object.assign(layoutState.plugins.api, api)
}

const getScale = () => layoutState.dimension.scale

// 激活setting面板并高亮提示
const activeSetting = (name) => {
  const { settings } = layoutState

  settings.render = name
  nextTick(() => {
    settings.activating = true
    setTimeout(() => {
      // 高亮提示延时
      settings.activating = false
    }, 1000)
  })
}
// 关闭右侧setting插件面板
const closeSetting = (forceClose) => {
  const { settings } = layoutState
  if (!settings.fixedPanels.includes(settings.render) || forceClose) {
    settings.render = null
  }
}

// 获取当前插件注册的Api
const getPluginApi = (pluginName) => {
  const { plugins } = layoutState

  return plugins.api[pluginName] || plugins.api
}

// 激活plugin面板并返回当前插件注册的Api
const activePlugin = (name, noActiveRender) => {
  const { plugins } = layoutState

  if (!noActiveRender) {
    plugins.render = name
  }

  return new Promise((resolve) => {
    nextTick(() => resolve(getPluginApi(name)))
  })
}

// 关闭左侧plugin插件面板
const closePlugin = (forceClose) => {
  const { plugins } = layoutState
  if (!plugins.fixedPanels.includes(plugins.render) || forceClose) {
    plugins.render = null
  }
}

const setDimension = (data) => {
  Object.assign(layoutState.dimension, data)
}

const getDimension = () => layoutState.dimension

const getPluginState = () => layoutState.plugins

const isEmptyPage = () => layoutState.pageStatus?.state === PAGE_STATUS.Empty

export default () => {
  return {
    PLUGIN_NAME,
    activeSetting,
    activePlugin,
    closePlugin,
    closeSetting,
    layoutState,
    getScale,
    setDimension,
    getDimension,
    registerPluginApi,
    getPluginApi,
    getPluginState,
    pluginState,
    isEmptyPage,
    getPluginWidth,
    changePluginWidth,
    leftFixedPanelsStorage,
    rightFixedPanelsStorage,
    changeLeftFixedPanels,
    changeRightFixedPanels
  }
}
