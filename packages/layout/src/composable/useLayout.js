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
import { META_APP as PLUGIN_NAME, getMetaApi } from '@opentiny/tiny-engine-meta-register'

const { PAGE_STATUS } = constants

const layoutState = reactive({
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
    pluginEvent: 'all'
  },
  settings: {
    render: 'props',
    api: null,
    activating: false, // 右侧面版激活提示状态
    showDesignSettings: true
  },
  toolbars: {
    visiblePopover: false
  },
  pageStatus: ''
})

const getScale = () => layoutState.dimension.scale

const getPluginState = () => layoutState.plugins

const getDimension = () => layoutState.dimension

const setDimension = (data) => {
  Object.assign(layoutState.dimension, data)
}

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

// 激活plugin面板并返回当前插件注册的Api
const activePlugin = (name, noActiveRender) => {
  const { plugins } = layoutState

  if (!noActiveRender) {
    plugins.render = name
  }

  return new Promise((resolve) => {
    nextTick(() => resolve(getMetaApi(name)))
  })
}

// 关闭插件面板
const closePlugin = (forceClose) => {
  const { plugins } = layoutState
  if (!plugins.fixedPanels.includes(plugins.render) || forceClose) {
    plugins.render = null
  }
}

const isEmptyPage = () => layoutState.pageStatus?.state === PAGE_STATUS.Empty

export default () => {
  return {
    PLUGIN_NAME,
    activeSetting,
    activePlugin,
    closePlugin,
    layoutState,
    getScale,
    setDimension,
    getDimension,
    getPluginState,
    isEmptyPage
  }
}
