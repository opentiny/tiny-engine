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

/* metaService: engine.service.layout */
import { reactive, nextTick } from 'vue'
import { useStorage } from '@vueuse/core'
import { constants } from '@opentiny/tiny-engine-utils'
import { META_APP as PLUGIN_NAME, getMetaApi, getMergeMeta } from '@opentiny/tiny-engine-meta-register'
import defaultLayout from '../defaultLayout'
import { utils } from '@opentiny/tiny-engine-utils'

const { PAGE_STATUS, STORAGE_KEY_LEFT_FIXED_PANELS, STORAGE_KEY_RIGHT_FIXED_PANELS, PLUGIN_DEFAULT_WIDTH } = constants
const { deepClone } = utils

const PLUGIN_POSITION = {
  leftTop: 'leftTop',
  leftBottom: 'leftBottom',
  independence: 'independence',
  rightTop: 'rightTop',
  rightBottom: 'rightBottom',
  fixed: 'fixed'
}

const pluginState = reactive({
  pluginEvent: 'all'
})

const layoutState = reactive({
  isMoveDragBar: false,
  dimension: {
    deviceType: 'desktop',
    width: '',
    maxWidth: '',
    minWidth: '',
    scale: 1,
    height: '100%'
  },
  plugins: {
    isShow: true,
    fixedPanels: [PLUGIN_NAME.Materials],
    render: PLUGIN_NAME.Materials,
    pluginEvent: 'all',
    activating: false, // 右侧面版激活提示状态
    showDesignSettings: true
  },
  settings: {
    isShow: true,
    fixedPanels: [PLUGIN_NAME.Props, PLUGIN_NAME.Styles, PLUGIN_NAME.Event],
    render: PLUGIN_NAME.Props,
    api: null,
    activating: false, // 右侧面版激活提示状态
    showDesignSettings: true
  },
  toolbars: {
    visiblePopover: false
  },
  pageStatus: ''
})
const getMoveDragBarState = () => {
  return layoutState.isMoveDragBar
}
const changeMoveDragBarState = (state) => {
  layoutState.isMoveDragBar = state
}
const leftMenuShownStorage = useStorage('leftMenuShown', layoutState.plugins.isShow)
const rightMenuShownStorage = useStorage('rightMenuShown', layoutState.settings.isShow)
const changeMenuShown = (menuName) => {
  switch (menuName) {
    case 'left': {
      leftMenuShownStorage.value = !leftMenuShownStorage.value
      break
    }
    case 'right': {
      rightMenuShownStorage.value = !rightMenuShownStorage.value
      break
    }
  }
}
const leftFixedPanelsStorage = useStorage(STORAGE_KEY_LEFT_FIXED_PANELS, layoutState.plugins.fixedPanels)
const rightFixedPanelsStorage = useStorage(STORAGE_KEY_RIGHT_FIXED_PANELS, layoutState.settings.fixedPanels)

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

const getScale = () => layoutState.dimension.scale

const getPluginState = () => layoutState.plugins
const getSettingState = () => layoutState.settings

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

/**
 * 两侧面板的固定状态
 */
const getFixedPanelsStatus = () => {
  const leftPanelFixed = leftFixedPanelsStorage.value.includes(layoutState.plugins.render)
  const rightPanelFixed = rightFixedPanelsStorage.value.includes(layoutState.settings.render)
  return { leftPanelFixed, rightPanelFixed }
}

const closeSetting = (forceClose) => {
  const { settings } = layoutState
  if (!settings.fixedPanels.includes(settings.render) || forceClose) {
    settings.render = null
  }
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
  let plugin = []

  try {
    const storedPlugin = localStorage.getItem('plugin')
    if (storedPlugin) {
      plugin = JSON.parse(storedPlugin)
    }
  } catch (error) {
    throw new Error(error)
  }

  // 如果 plugin 不是一个数组，则将其重置为默认值
  if (!Array.isArray(plugin)) {
    plugin = []
  }

  const pluginStorageReactive = useStorage('plugin', plugin)

  // 获取插件宽度
  const getPluginWidth = (name) => pluginStorageReactive.value[name]?.width || PLUGIN_DEFAULT_WIDTH

  // 修改插件宽度
  const changePluginWidth = (name, width, offset) => {
    if (Object.prototype.hasOwnProperty.call(pluginStorageReactive.value, name)) {
      pluginStorageReactive.value[name].width = width
      pluginStorageReactive.value[name].offset = offset
    } else {
      pluginStorageReactive.value[name] = {
        width
      }
    }
  }

  // 获取插件布局
  const getPluginByLayout = (name) => pluginStorageReactive.value[name]?.align || 'leftTop'

  // 获取某个布局（左上/左下/右上/右下）的插件名称列表
  const getPluginsByLayout = (layout = 'all') => {
    // 筛选出符合布局条件的插件名称
    const pluginNames = Object.keys(pluginStorageReactive.value).filter(
      (key) => pluginStorageReactive.value[key].align === layout || layout === 'all'
    )

    pluginNames.sort((a, b) => pluginStorageReactive.value[a].index - pluginStorageReactive.value[b].index)

    return pluginNames
  }

  const getPluginById = (pluginList, pluginId) => {
    return pluginList.find((item) => item.id === pluginId)
  }

  const getPluginsByPosition = (position, pluginList) => {
    const res = getPluginsByLayout(position).map((pluginId) => getPluginById(pluginList, pluginId))
    return res
  }

  // 修改某个插件的布局
  const changePluginLayout = (name, layout) => {
    if (pluginStorageReactive.value[name]) {
      pluginStorageReactive.value[name].align = layout
    }
  }

  /**
   * 拖拽后改变插件位置
   * @param {*} from 插件的起始位置
   * @param {*} to  插件的结束位置
   * @param {*} oldIndex  插件的起始索引
   * @param {*} newIndex 插件的结束索引
   * @returns
   */
  const dragPluginLayout = (from, to, oldIndex, newIndex) => {
    if (from === to && oldIndex === newIndex) return

    const items = Object.values(pluginStorageReactive.value)
    // 记录拖拽项
    const movedItem = items.find((item) => item.align === from && item.index === oldIndex)

    // 同一列表中的拖拽
    if (from === to) {
      if (oldIndex < newIndex) {
        //往后移动
        items.forEach((item) => {
          if (item !== movedItem && item.align === from && item.index > oldIndex && item.index <= newIndex) {
            item.index -= 1
          }
        })
      } else {
        //往前移动
        items.forEach((item) => {
          if (item !== movedItem && item.align === from && item.index >= newIndex && item.index < oldIndex) {
            item.index += 1
          }
        })
      }
    } else {
      // 跨列表拖拽
      items.forEach((item) => {
        if (item !== movedItem && item.align === from && item.index > oldIndex) {
          item.index -= 1
        }
        if (item !== movedItem && item.align === to && item.index >= newIndex) {
          item.index += 1
        }
      })
    }

    // 更新拖拽项的位置
    if (movedItem) {
      movedItem.align = to
      movedItem.index = newIndex
    }
  }

  //判断是否在同一侧
  const isSameSide = (from, to) => {
    const leftSide = [PLUGIN_POSITION.leftTop, PLUGIN_POSITION.leftBottom]
    const rightSide = [PLUGIN_POSITION.rightTop, PLUGIN_POSITION.rightBottom]

    const isLeft = leftSide.includes(from) && leftSide.includes(to)
    const isRight = rightSide.includes(from) && rightSide.includes(to)

    return isLeft || isRight
  }

  //获取插件显示状态
  const getPluginShown = (name) => pluginStorageReactive.value[name]?.isShow

  //修改插件显示状态
  const changePluginShown = (name) => {
    if (!pluginStorageReactive.value[name]) {
      pluginStorageReactive.value[name] = { isShow: true }
    }
    pluginStorageReactive.value[name].isShow = !pluginStorageReactive.value[name].isShow
  }

  /**
   * 返回面板是否宽度可调
   * @param {string} name 插件名称
   * @returns
   */
  const isPanelWidthResizable = (name) => pluginStorageReactive.value[name]?.widthResizable

  const initPluginStorageReactive = (pluginList) => {
    if (Object.keys(pluginStorageReactive.value).length) return
    pluginStorageReactive.value = pluginList
  }

  const getIsUserCustomLayout = () => {
    const defaultLayoutString = JSON.stringify(defaultLayout)
    const userLayoutString = JSON.stringify(getMergeMeta('engine.layout')?.options?.layoutConfig)

    return defaultLayoutString !== userLayoutString
  }

  const getPluginOrder = (plugins) => {
    const { top, bottom } = plugins
    const allPlugins = [
      ...top.map((id) => ({ id, position: 'top' })),
      ...bottom.map((id) => ({ id, position: 'bottom' }))
    ]
    const finalPlugins = [...allPlugins]

    allPlugins.forEach((item, index) => {
      const pluginItem = getMergeMeta(item.id)
      if (!pluginItem) {
        finalPlugins.splice(index, 1)
        return
      }
      if (pluginItem.insertBefore && allPlugins.find((p) => p.id === pluginItem.insertBefore)) {
        const targetIndex = allPlugins.findIndex((p) => p.id === pluginItem.insertBefore)
        const insertBeforeItem = allPlugins[targetIndex]
        // 如果位置和 insertBeforeItem 不相同，则修改相对位置
        if (insertBeforeItem.position !== item.position) {
          item.position = insertBeforeItem.position
        }
        // 插入到前面
        finalPlugins.splice(targetIndex, 0, item)
        // 在原来的位置进行移除
        const oldIndex = allPlugins.findIndex((p) => p.id === item.id)
        finalPlugins.splice(oldIndex, 1)
      } else if (pluginItem.insertAfter && allPlugins.find((p) => p.id === pluginItem.insertAfter)) {
        const targetIndex = allPlugins.findIndex((p) => p.id === pluginItem.insertAfter)
        const insertAfterItem = allPlugins[targetIndex]
        // 如果位置和 insertAfterItem 不相同，则修改相对位置
        if (insertAfterItem.position !== item.position) {
          item.position = insertAfterItem.position
        }
        // 插入到后面
        finalPlugins.splice(targetIndex + 1, 0, item)
        // 在原来的位置进行移除
        const oldIndex = allPlugins.findIndex((p) => p.id === item.id)
        finalPlugins.splice(oldIndex, 1)
      }
    })

    return {
      top: finalPlugins.filter((item) => item.position === 'top').map((item) => item.id),
      bottom: finalPlugins.filter((item) => item.position === 'bottom').map((item) => item.id)
    }
  }

  // const getToolbarsOrder = (toolbars) => {
  //   const allToolbars = [
  //     ...toolbars.left.map((id) => ({ id, position: 'left' })),
  //     ...toolbars.center.map((id) => ({ id, position: 'center' })),
  //     ...toolbars.right.map((id) => ({ id, position: 'right' })),
  //     ...toolbars.collapse.map((id) => ({ id, position: 'collapse' }))
  //   ]
  //   const finalToolbars = [...allToolbars]
  //   allToolbars.forEach((item, index) => {
  //     // 暂时不支持组的 insertBefore、insertAfter，因为这里有组的概念
  //     if (Array.isArray(item)) {
  //       return
  //     }

  //     const toolbarItem = getMergeMeta(item.id)

  //     if (!toolbarItem) {
  //       finalToolbars.splice(index, 1)
  //       return
  //     }

  //     if (toolbarItem.insertBefore && finalToolbars.find((p) => p.id === toolbarItem.insertBefore)) {
  //       const insertBeforeItem = finalToolbars.find((p) => p.id === toolbarItem.insertBefore)
  //       // 如果位置和 insertBeforeItem 不相同，则修改相对位置
  //       if (insertBeforeItem.position !== item.position) {
  //         item.position = insertBeforeItem.position
  //       }
  //       // 插入到前面
  //       finalToolbars.splice(index, 0, item)
  //       // 在原来的位置进行移除
  //       const oldIndex = allToolbars.findIndex((p) => p.id === item.id)
  //       finalToolbars.splice(oldIndex, 1)
  //     } else if (toolbarItem.insertAfter && finalToolbars.find((p) => p.id === toolbarItem.insertAfter)) {
  //       const insertAfterItem = finalToolbars.find((p) => p.id === toolbarItem.insertAfter)
  //       // 如果位置和 insertAfterItem 不相同，则修改相对位置
  //       if (insertAfterItem.position !== item.position) {
  //         item.position = insertAfterItem.position
  //       }
  //       // 插入到后面
  //       finalToolbars.splice(index + 1, 0, item)
  //       // 在原来的位置进行移除
  //       const oldIndex = allToolbars.findIndex((p) => p.id === item.id)
  //       finalToolbars.splice(oldIndex, 1)
  //     }
  //   })

  //   return {
  //     left: finalToolbars.filter((item) => item.position === 'left').map((item) => item.id),
  //     center: finalToolbars.filter((item) => item.position === 'center').map((item) => item.id),
  //     right: finalToolbars.filter((item) => item.position === 'right').map((item) => item.id),
  //     collapse: finalToolbars.filter((item) => item.position === 'collapse').map((item) => item.id)
  //   }
  // }

  const getSettingsOrder = (settings) => {
    const finalSettings = [...settings]
    settings.forEach((item, index) => {
      const settingItem = getMergeMeta(item)
      if (!settingItem) {
        finalSettings.splice(index, 1)
        return
      }
      if (settingItem.insertBefore && finalSettings.find((p) => p === settingItem.insertBefore)) {
        const targetIndex = finalSettings.findIndex((p) => p === settingItem.insertBefore)
        finalSettings.splice(targetIndex, 0, item)
        // 在原来的位置进行移除
        const oldIndex = finalSettings.findIndex((p) => p === item.id)
        finalSettings.splice(oldIndex, 1)
      } else if (settingItem.insertAfter && finalSettings.find((p) => p === settingItem.insertAfter)) {
        const targetIndex = finalSettings.findIndex((p) => p === settingItem.insertAfter)
        finalSettings.splice(targetIndex + 1, 0, item)
        // 在原来的位置进行移除
        const oldIndex = finalSettings.findIndex((p) => p === item.id)
        finalSettings.splice(oldIndex, 1)
      }
    })

    return finalSettings
  }

  let finalLayoutConfig = null

  const getFinalLayoutConfig = () => {
    if (finalLayoutConfig) {
      return finalLayoutConfig
    }

    const isUserCustomLayout = getIsUserCustomLayout()
    // 用户传了自定义配置，则忽略 insertBefore insertAfter 的配置
    if (isUserCustomLayout) {
      return getMergeMeta('engine.layout')?.options?.layoutConfig
    }

    const { plugins, toolbars, settings } = deepClone(defaultLayout)
    const finalPlugins = getPluginOrder(plugins)
    // 暂时不支持组的 insertBefore、insertAfter，因为这里有组的概念
    const finalToolbars = toolbars
    const finalSettings = getSettingsOrder(settings)

    finalLayoutConfig = {
      plugins: finalPlugins,
      toolbars: finalToolbars,
      settings: finalSettings
    }

    return finalLayoutConfig
  }

  return {
    isPanelWidthResizable,
    getFixedPanelsStatus,
    initPluginStorageReactive,
    PLUGIN_NAME,
    PLUGIN_POSITION,
    activeSetting,
    closeSetting,
    activePlugin,
    closePlugin,
    layoutState,
    getScale,
    setDimension,
    getDimension,
    getPluginById,
    pluginState,
    getPluginState,
    getSettingState,
    isEmptyPage,
    getPluginWidth,
    changePluginWidth,
    leftFixedPanelsStorage,
    rightFixedPanelsStorage,
    leftMenuShownStorage,
    rightMenuShownStorage,
    changeLeftFixedPanels,
    changeRightFixedPanels,
    getPluginsByLayout,
    changePluginLayout,
    getPluginByLayout,
    dragPluginLayout,
    isSameSide,
    getPluginShown,
    changePluginShown,
    changeMenuShown,
    getMoveDragBarState,
    changeMoveDragBarState,
    getPluginsByPosition,
    getFinalLayoutConfig
  }
}
