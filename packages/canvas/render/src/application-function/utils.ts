import { ref } from 'vue'
import TinyVue from '@opentiny/vue'
import * as TinyVueIcon from '@opentiny/vue-icon'
import { generateFunction } from '../data-utils'
import { globalNotify } from '../canvas-function'

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

  const setUtils = async (data: Array<IUtil>) => {
    if (!Array.isArray(data)) {
      return
    }

    // 筛选出来已经被删除的 key
    const newKeys = new Set(data.map(({ name }) => name))
    const currentKeys = Object.keys(utils)
    const deletedUtilsKeys = currentKeys.filter((item) => !newKeys.has(item))

    for (const key of deletedUtilsKeys) {
      delete utils[key]
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

    const validNPMUtils = data.filter((item) => item.type === 'npm' && item.content.cdnLink)

    const npmUtilsImports = validNPMUtils.map((item) => import(/* @vite-ignore */ item.content.cdnLink))
    const npmUtils = await Promise.allSettled(npmUtilsImports)

    npmUtils.forEach((res, index) => {
      const { name, content } = validNPMUtils[index]
      const { exportName, destructuring, cdnLink } = content

      if (res.status !== 'fulfilled') {
        globalNotify({
          type: 'error',
          message: `加载工具类“${name}”失败，请检查cdn链接是否正确，${cdnLink}`
        })

        return
      }

      const module = res.value
      utilsCollection[name] = destructuring ? module[exportName] : module.default
    })

    Object.assign(utils, utilsCollection)

    refreshKey.value++
  }

  return {
    refreshKey,
    utils,
    getUtils,
    setUtils
  }
}
