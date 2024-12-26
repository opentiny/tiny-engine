import { ref } from 'vue'
import TinyVue from '@opentiny/vue'
import * as TinyVueIcon from '@opentiny/vue-icon'
import { generateFunction, reset } from '../data-utils'

export interface IUtil {
  name: string
  type: 'function' | string
  content: {
    exportName?: string
    [props: string]: any
  }
  [props: string]: any
}

export function useUtils(context: Record<string, any>) {
  const refreshKey = ref<number>(0)
  const utils: Record<string, Function | any> = {}
  const getUtils = () => utils

  const setUtils = (data: Array<IUtil>, clear = false, isForceRefresh = false) => {
    if (clear) {
      reset(utils)
    }
    const utilsCollection = {}
    // 目前画布还不具备远程加载utils工具类的功能，目前只能加载TinyVue组件库中的组件工具
    data?.forEach((item) => {
      const util = TinyVue[item.content.exportName]
      if (util) {
        utilsCollection[item.name] = util
      }

      // 此处需要把工具类中的icon图标也加入utils上下文环境
      const utilIcon = TinyVueIcon[item.content.exportName]
      if (utilIcon) {
        utilsCollection[item.name] = utilIcon
      }

      // 解析函数式的工具类
      if (item.type === 'function') {
        const defaultFn = () => {}
        utilsCollection[item.name] = generateFunction(item.content.value, context) || defaultFn
      }
    })
    Object.assign(utils, utilsCollection)

    // 因为工具类并不具有响应式行为，所以需要通过修改key来强制刷新画布
    if (isForceRefresh) {
      refreshKey.value++
    }
  }

  const updateUtils = (data: Array<IUtil>) => {
    setUtils(data, false, true)
  }

  const deleteUtils = (data: Array<IUtil>) => {
    data?.forEach((item) => {
      if (utils[item.name]) {
        delete utils[item.name]
      }
    })
    setUtils([], false, true)
  }

  return {
    refreshKey,
    utils,
    getUtils,
    setUtils,
    updateUtils,
    deleteUtils
  }
}
