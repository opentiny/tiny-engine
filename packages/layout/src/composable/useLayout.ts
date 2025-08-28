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

/* metaService: engine.service.layout.useLayout */
import { reactive, nextTick } from 'vue'
import { useStorage } from '@vueuse/core'
import { constants } from '@opentiny/tiny-engine-utils'
import { META_APP as PLUGIN_NAME, getMetaApi, getMergeMeta, getAllMergeMeta } from '@opentiny/tiny-engine-meta-register'
import defaultLayout from '../defaultLayout'
import { utils } from '@opentiny/tiny-engine-utils'

const { PAGE_STATUS, STORAGE_KEY_LEFT_FIXED_PANELS, STORAGE_KEY_RIGHT_FIXED_PANELS, PLUGIN_DEFAULT_WIDTH } = constants
const { deepClone } = utils
// MetaApi 类型定义
export interface IMetaApi {
  [key: string]: any
}

export interface IPluginPosition {
  leftTop: string
  leftBottom: string
  independence: string
  rightTop: string
  rightBottom: string
  fixed: string
}

export interface IPluginState {
  pluginEvent: 'all' | string
}

export interface IDimension {
  deviceType: 'desktop' | 'tablet' | 'mobile'
  width: string
  maxWidth: string
  minWidth: string
  scale: number
  height: string
}

export interface IPluginBase {
  isShow: boolean
  fixedPanels: string[]
  render: string
  activating: boolean
  showDesignSettings: boolean
}

export interface IPlugins extends IPluginBase, IPluginState {}

export interface ISettings extends IPluginBase {
  api: IMetaApi | null
}

export interface ILayoutState {
  isMoveDragBar: boolean
  dimension: IDimension
  plugins: IPlugins
  settings: ISettings
  toolbars: {
    visiblePopover: boolean
  }
  pageStatus: any
}

export interface IPluginStorageItem {
  width?: number | undefined
  offset?: number
  align?: string
  index: number
  isShow?: boolean
  widthResizable?: boolean
}

export interface IPluginStorage {
  [key: string]: IPluginStorageItem
}

export interface IPlugin {
  id: string
  componentName?: string
  name?: string
  label?: string
  [key: string]: any
}

const PLUGIN_POSITION: IPluginPosition = {
  leftTop: 'leftTop',
  leftBottom: 'leftBottom',
  independence: 'independence',
  rightTop: 'rightTop',
  rightBottom: 'rightBottom',
  fixed: 'fixed'
}

const pluginState = reactive<IPluginState>({
  pluginEvent: 'all'
})

const layoutState = reactive<ILayoutState>({
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
  pageStatus: {
    state: '',
    data: {}
  }
})

const getMoveDragBarState = (): boolean => {
  return layoutState.isMoveDragBar
}

const changeMoveDragBarState = (state: boolean): void => {
  layoutState.isMoveDragBar = state
}

const leftMenuShownStorage = useStorage<boolean>('leftMenuShown', layoutState.plugins.isShow)
const rightMenuShownStorage = useStorage<boolean>('rightMenuShown', layoutState.settings.isShow)

const changeMenuShown = (menuName: 'left' | 'right'): void => {
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

const leftFixedPanelsStorage = useStorage<string[]>(STORAGE_KEY_LEFT_FIXED_PANELS, layoutState.plugins.fixedPanels)
const rightFixedPanelsStorage = useStorage<string[]>(STORAGE_KEY_RIGHT_FIXED_PANELS, layoutState.settings.fixedPanels)

const changeLeftFixedPanels = (pluginName: string): void => {
  leftFixedPanelsStorage.value = leftFixedPanelsStorage.value?.includes(pluginName)
    ? leftFixedPanelsStorage.value?.filter((item) => item !== pluginName)
    : [...leftFixedPanelsStorage.value, pluginName]
}

const changeRightFixedPanels = (pluginName: string): void => {
  rightFixedPanelsStorage.value = rightFixedPanelsStorage.value?.includes(pluginName)
    ? rightFixedPanelsStorage.value?.filter((item) => item !== pluginName)
    : [...rightFixedPanelsStorage.value, pluginName]
}

const getScale = (): number => layoutState.dimension.scale

const getPluginState = (): IPlugins => layoutState.plugins
const getSettingState = (): ISettings => layoutState.settings

const getDimension = (): IDimension => layoutState.dimension

const setDimension = (data: Partial<IDimension>): void => {
  Object.assign(layoutState.dimension, data)
}

// 激活setting面板并高亮提示
const activeSetting = (name: string): void => {
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

const closeSetting = (forceClose?: boolean) => {
  const { settings } = layoutState
  if (!rightFixedPanelsStorage.value.includes(settings.render) || forceClose) {
    settings.render = ''
  }
}

// 激活plugin面板并返回当前插件注册的Api
const activePlugin = (name: string, noActiveRender?: boolean) => {
  const { plugins } = layoutState

  if (!noActiveRender) {
    plugins.render = name
  }

  return new Promise<IMetaApi>((resolve) => {
    nextTick(() => resolve(getMetaApi(name)))
  })
}

// 关闭插件面板
const closePlugin = (forceClose?: boolean) => {
  const { plugins } = layoutState
  if (!leftFixedPanelsStorage.value.includes(plugins.render) || forceClose) {
    plugins.render = ''
  }
}

const isEmptyPage = () => layoutState.pageStatus?.state === PAGE_STATUS.Empty

export default () => {
  let plugin: IPluginStorage = {}

  try {
    const storedPlugin = localStorage.getItem('plugin')
    if (storedPlugin) {
      plugin = JSON.parse(storedPlugin) as IPluginStorage
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message)
    }
    throw new Error('Failed to parse plugin storage')
  }

  const pluginStorageReactive = useStorage<IPluginStorage>('plugin', plugin)

  // 获取插件宽度
  const getPluginWidth = (name: string) => pluginStorageReactive.value[name]?.width || PLUGIN_DEFAULT_WIDTH

  // 修改插件宽度
  const changePluginWidth = (name: string, width: number, offset?: number): void => {
    if (Object.prototype.hasOwnProperty.call(pluginStorageReactive.value, name)) {
      pluginStorageReactive.value[name].width = width
      if (typeof offset === 'number') {
        pluginStorageReactive.value[name].offset = offset
      }
    } else {
      pluginStorageReactive.value[name] = { width, index: 0, isShow: true }
    }
  }

  // 获取插件布局
  const getPluginByLayout = (name: string): string => pluginStorageReactive.value[name]?.align || 'leftTop'

  // 获取某个布局（左上/左下/右上/右下）的插件名称列表
  const getPluginsByLayout = (layout: string = 'all'): string[] => {
    const pluginNames = Object.keys(pluginStorageReactive.value).filter(
      (key) => pluginStorageReactive.value[key].align === layout || layout === 'all'
    )

    pluginNames.sort((a, b) => pluginStorageReactive.value[a].index - pluginStorageReactive.value[b].index)

    return pluginNames
  }

  const getPluginById = (pluginList: IPlugin[], pluginId: string): IPlugin | undefined => {
    return pluginList.find((item) => item.id === pluginId)
  }

  const getPluginsByPosition = (position: string, pluginList: IPlugin[]): IPlugin[] => {
    const res = getPluginsByLayout(position)
      .map((pluginId) => getPluginById(pluginList, pluginId))
      .filter((plugin): plugin is IPlugin => Boolean(plugin))
    return res
  }

  // 修改某个插件的布局
  const changePluginLayout = (name: string, layout: string): void => {
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
  const dragPluginLayout = (from: string, to: string, oldIndex: number, newIndex: number): void => {
    if (from === to && oldIndex === newIndex) return

    const items = Object.values(pluginStorageReactive.value)
    const movedItem = items.find((item) => item.align === from && item.index === oldIndex)

    // 同一列表的拖拽
    if (from === to) {
      if (oldIndex < newIndex) {
        // 往后移动
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
  const isSameSide = (from: string, to: string): boolean => {
    const leftSide = [PLUGIN_POSITION.leftTop, PLUGIN_POSITION.leftBottom]
    const rightSide = [PLUGIN_POSITION.rightTop, PLUGIN_POSITION.rightBottom]

    const isLeft = leftSide.includes(from) && leftSide.includes(to)
    const isRight = rightSide.includes(from) && rightSide.includes(to)

    return isLeft || isRight
  }

  //获取插件显示状态
  const getPluginShown = (name: string): boolean => pluginStorageReactive.value[name]?.isShow || false

  //修改插件显示状态
  const changePluginShown = (name: string): void => {
    if (!pluginStorageReactive.value[name]) {
      pluginStorageReactive.value[name] = { isShow: true, index: 0 }
    }
    pluginStorageReactive.value[name].isShow = !pluginStorageReactive.value[name].isShow
  }

  /**
   * 返回面板是否宽度可调
   * @param {string} name 插件名称
   * @returns
   */
  const isPanelWidthResizable = (name: string): boolean => pluginStorageReactive.value[name]?.widthResizable || false

  const initPluginStorageReactive = (pluginList: IPluginStorage): void => {
    pluginStorageReactive.value = pluginList
  }

  const removeUndefineLayoutId = (layout) => {
    if (Array.isArray(layout)) {
      layout.forEach((item, index) => {
        if (Array.isArray(item)) {
          removeUndefineLayoutId(item)
        }
        // 对象类型，则递归遍历
        else if (Object.prototype.toString.call(item) === '[object Object]') {
          removeUndefineLayoutId(item)
        }
        // 注册表中找不到，则删除
        else if (typeof item === 'string' && !getMergeMeta(item)) {
          layout.splice(index, 1)
        }
      })
    }

    if (Object.prototype.toString.call(layout) === '[object Object]') {
      Object.values(layout).forEach((value) => {
        removeUndefineLayoutId(value)
      })
    }
  }

  const removeById = (layout, id) => {
    if (Array.isArray(layout)) {
      layout.forEach((item, index) => {
        if (Array.isArray(item)) {
          removeById(item, id)
        } else if (Object.prototype.toString.call(item) === '[object Object]') {
          removeById(item, id)
        } else if (item === id) {
          layout.splice(index, 1)
        }
      })
    }

    if (Object.prototype.toString.call(layout) === '[object Object]') {
      Object.values(layout).forEach((value) => {
        removeById(value, id)
      })
    }
  }

  const replaceByPosition = (layout, originId, targetId, position) => {
    if (Array.isArray(layout)) {
      for (let i = 0; i < layout.length; i++) {
        const item = layout[i]
        if (Array.isArray(item)) {
          replaceByPosition(item, originId, targetId, position)
        } else if (Object.prototype.toString.call(item) === '[object Object]') {
          replaceByPosition(item, originId, targetId, position)
        } else if (item === targetId) {
          const insertIndex = position === 'before' ? i : i + 1
          layout.splice(insertIndex, 0, originId)
          // 完成替换，结束循环，提前 return
          return
        }
      }
      return
    }

    if (Object.prototype.toString.call(layout) === '[object Object]') {
      Object.values(layout).forEach((value) => {
        replaceByPosition(value, originId, targetId, position)
      })
    }
  }

  const computeFinalLayoutConfig = (layout, relativeLayoutConfig) => {
    const finalLayoutConfig = deepClone(layout)

    Object.entries(relativeLayoutConfig).forEach(([key, value]) => {
      if (value.insertBefore) {
        // 移除原来的 id
        removeById(finalLayoutConfig, key)
        // 插入到指定 id 前面
        replaceByPosition(finalLayoutConfig, key, value.insertBefore, 'before')
      } else if (value.insertAfter) {
        // 移除原来的 id
        removeById(finalLayoutConfig, key)
        // 插入到指定 id 后面
        replaceByPosition(finalLayoutConfig, key, value.insertAfter, 'after')
      }
    })

    removeUndefineLayoutId(finalLayoutConfig)

    return finalLayoutConfig
  }

  let finalLayoutConfig = null

  const getFinalLayoutConfig = () => {
    if (finalLayoutConfig) {
      return finalLayoutConfig
    }

    const userCustomLayout = getMergeMeta('engine.layout')?.options?.layoutConfig
    // 用户传了自定义配置，则忽略 insertBefore insertAfter 的配置
    if (userCustomLayout) {
      return userCustomLayout
    }

    const relativeLayoutConfig = getMergeMeta('engine.layout')?.options?.relativeLayoutConfig || {}
    finalLayoutConfig = computeFinalLayoutConfig(deepClone(defaultLayout), relativeLayoutConfig)

    return finalLayoutConfig
  }

  const getAllPlugins = () => {
    return getAllMergeMeta()
      .filter((item) => item.type === 'plugin')
      .map((item) => {
        return {
          id: item.id,
          title: item.title,
          type: item.type
        }
      })
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
    getFinalLayoutConfig,
    getAllPlugins
  }
}
