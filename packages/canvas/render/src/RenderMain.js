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

import { h, provide, inject, nextTick, shallowReactive, reactive, ref, watch, watchEffect, onUnmounted } from 'vue'
import { I18nInjectionKey } from 'vue-i18n'
import TinyVue from '@opentiny/vue'
import * as TinyVueIcon from '@opentiny/vue-icon'
import { useBroadcastChannel, useThrottleFn } from '@vueuse/core'
import { constants, utils as commonUtils } from '@opentiny/tiny-engine-utils'
import renderer, {
  parseData,
  setConfigure,
  setController,
  globalNotify,
  isStateAccessor,
  removeBlockCompsCache
} from './render'
import { setContext, getContext, setCondition, context, getDesignMode, setDesignMode } from './context'
import CanvasEmpty from './CanvasEmpty.vue'

const { BROADCAST_CHANNEL } = constants
const { parseFunction: generateFunction } = commonUtils

const reset = (obj) => {
  Object.keys(obj).forEach((key) => delete obj[key])
}

const refreshKey = ref(0)
const methods = {}
const schema = reactive({})
const state = shallowReactive({})
const bridge = {}
const utils = {}
const props = {}

const globalState = ref([])
const stores = shallowReactive({})
const dataSourceMap = shallowReactive({})

watchEffect(() => {
  reset(stores)
  globalState.value.forEach(({ id, state = {}, getters = {} }) => {
    const computedGetters = Object.keys(getters).reduce(
      (acc, key) => ({
        ...acc,
        [key]: parseData(getters[key], null, acc)?.call?.(acc, state)
      }),
      {}
    )

    stores[id] = { ...state, ...computedGetters }
  })
})

const getDeletedKeys = (objA, objB) => {
  const keyA = Object.keys(objA)
  const keyB = new Set(Object.keys(objB))

  return keyA.filter((item) => !keyB.has(item))
}

const getUtils = () => utils

const setUtils = (data) => {
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
  Object.assign(utils, utilsCollection)

  // 因为工具类并不具有响应式行为，所以需要通过修改key来强制刷新画布
  refreshKey.value++
}

const setMethods = (data = {}, clear) => {
  clear && reset(methods)
  // 这里有些方法在画布还是有执行的必要的，比如说表格的renderer和formatText方法，包括一些自定义渲染函数
  Object.assign(
    methods,
    Object.fromEntries(
      Object.keys(data).map((key) => {
        return [key, parseData(data[key], {}, getContext())]
      })
    )
  )
  setContext(methods)
}

const generateAccessor = (type, accessor, property) => {
  const accessorFn = generateFunction(accessor[type].value, context)

  return { property, accessorFn, type }
}

// 这里缓存状态变量对应的访问器，用于watchEffect更新和取消监听
const stateAccessorMap = new Map()

// 缓存区块属性的访问器
const propsAccessorMap = new Map()

const generateStateAccessors = (type, accessor, key) => {
  const stateWatchEffectKey = `${key}${type}`
  const { property, accessorFn } = generateAccessor(type, accessor, key)

  // 将之前已有的watchEffect取消监听,这里操作很有必要，不然会造成数据混乱
  stateAccessorMap.get(stateWatchEffectKey)?.()

  // 更新watchEffect监听
  stateAccessorMap.set(
    stateWatchEffectKey,
    watchEffect(() => {
      try {
        accessorFn()
      } catch (error) {
        globalNotify({
          type: 'warning',
          title: `状态变量${property}的访问器函数:${accessorFn.name}执行报错`,
          message: error?.message || `状态变量${property}的访问器函数:${accessorFn.name}执行报错，请检查语法`
        })
      }
    })
  )
}

const setState = (data) => {
  if (typeof data !== 'object' || data === null) {
    return
  }

  const deletedKeys = getDeletedKeys(state, data)

  // 同步删除的 key
  for (const key of deletedKeys) {
    delete state[key]
  }

  Object.assign(state, parseData(data, {}, getContext()) || {})

  // 在状态变量合并之后，执行访问器中watchEffect，为了可以在访问器函数中可以访问其他state变量
  Object.entries(data || {})?.forEach(([key, stateData]) => {
    if (isStateAccessor(stateData)) {
      const accessor = stateData.accessor
      if (accessor?.getter?.value) {
        generateStateAccessors('getter', accessor, key)
      }

      if (accessor?.setter?.value) {
        generateStateAccessors('setter', accessor, key)
      }
    }
  })
}

const getDataSourceMap = () => {
  return dataSourceMap.value
}

const setDataSourceMap = (list) => {
  dataSourceMap.value = list.reduce((dMap, config) => {
    const dataSource = { config: config.data }

    const result = {
      code: '',
      msg: 'success',
      data: {}
    }
    result.data =
      dataSource.config.type === 'array'
        ? { items: dataSource?.config?.data, total: dataSource?.config?.data?.length }
        : dataSource?.config?.data

    dataSource.load = () => Promise.resolve(result)
    dMap[config.name] = dataSource

    return dMap
  }, {})

  Object.defineProperty(context, 'dataSourceMap', {
    get: getDataSourceMap
  })
}

const setGlobalState = (data = []) => {
  globalState.value = data
}

const setProps = (data, clear) => {
  clear && reset(props)
  Object.assign(props, data)
}

const initProps = (properties = []) => {
  const props = {}
  const accessorFunctions = []

  properties.forEach(({ content = [] }) => {
    content.forEach(({ defaultValue, property, accessor }) => {
      // 如果没有设置defaultValue就是undefined这和vue处理方式一样
      props[property] = defaultValue

      // 如果区块属性有访问器accessor，则先解析getter和setter函数
      if (accessor?.getter?.value) {
        // 此处不能直接执行watchEffect，需要在上下文环境设置好之后去执行，此处只是收集函数
        accessorFunctions.push(generateAccessor('getter', accessor, property))
      }

      if (accessor?.setter?.value) {
        accessorFunctions.push(generateAccessor('setter', accessor, property))
      }
    })
  })

  setProps(props, true)

  return accessorFunctions
}

const setPageCss = (css = '') => {
  const id = 'page-css'
  let element = document.getElementById(id)
  const head = document.querySelector('head')

  document.body.setAttribute('style', '')

  if (!element) {
    element = document.createElement('style')
    element.setAttribute('type', 'text/css')
    element.setAttribute('id', id)

    element.innerHTML = css
    head.appendChild(element)
  } else {
    element.innerHTML = css
  }
}

const setSchema = async (data) => {
  const newSchema = JSON.parse(JSON.stringify(data || schema))
  reset(schema)
  // 页面初始化的时候取消所有状态变量的watchEffect监听
  stateAccessorMap.forEach((stateAccessorFn) => {
    stateAccessorFn()
  })

  // 区块初始化的时候取消所有的区块属性watchEffect监听
  propsAccessorMap.forEach((propsAccessorFn) => {
    propsAccessorFn()
  })

  // 清空存状态变量和区块props访问器的缓存
  stateAccessorMap.clear()
  propsAccessorMap.clear()

  const context = {
    utils,
    bridge,
    stores,
    state,
    props,
    dataSourceMap: {},
    emit: () => {} // 兼容访问器中getter和setter中this.emit写法
  }
  Object.defineProperty(context, 'dataSourceMap', {
    get: getDataSourceMap
  })
  // 此处提升很重要，因为setState、initProps也会触发画布重新渲染，所以需要提升上下文环境的设置时间
  setContext(context, true)

  // 设置方法调用上下文
  setMethods(newSchema.methods, true)

  // 如果是区块则需要设置对外暴露的props
  const accessorFunctions = initProps(newSchema.schema?.properties)

  // 这里setState（会触发画布渲染），是因为状态管理里面的变量会用到props、utils、bridge、stores、methods
  setState(newSchema.state, true)

  await nextTick()
  setPageCss(data.css)
  Object.assign(schema, newSchema)

  // 当上下文环境设置完成之后再去处理区块属性访问器的watchEffect
  accessorFunctions.forEach(({ property, accessorFn, type }) => {
    const propsWatchEffectKey = `${property}${type}`
    propsAccessorMap.set(
      propsWatchEffectKey,
      watchEffect(() => {
        try {
          accessorFn()
        } catch (error) {
          globalNotify({
            type: 'warning',
            title: `区块属性${property}的访问器函数:${accessorFn.name}执行报错`,
            message: error?.message || `区块属性${property}的访问器函数:${accessorFn.name}执行报错，请检查语法`
          })
        }
      })
    )
  })

  return schema
}

let canvasRenderer = null

const defaultRenderer = function () {
  // 渲染画布增加根节点，与出码和预览保持一致
  const rootChildrenSchema = {
    id: 0,
    componentName: 'div',
    // 手动添加一个唯一的属性，后续在画布选中此节点时方便处理额外的逻辑。由于没有修改schema，不会影响出码
    props: { ...schema.props, 'data-id': 'root-container' },
    children: schema.children
  }

  return h(
    // TODO: 这里顶层的 i18n-host 在不支持 webComponent 的区块之后，应该也不需要webComponent 的 i18n provider 了
    'tiny-i18n-host',
    {
      locale: 'zh_CN',
      key: refreshKey.value,
      ref: 'page',
      className: 'design-page'
    },
    schema.children?.length ? h(renderer, { schema: rootChildrenSchema, parent: schema }) : [h(CanvasEmpty)]
  )
}

const getRenderer = () => canvasRenderer || defaultRenderer

const setRenderer = (fn) => {
  canvasRenderer = fn
}

const updateCanvas = () => {
  refreshKey.value++
}
const throttleUpdateSchema = useThrottleFn(
  () => {
    window.host.patchLatestSchema(schema)
  },
  100,
  true
)

export default {
  setup() {
    provide('rootSchema', schema)

    const { locale } = inject(I18nInjectionKey).global
    const { data } = useBroadcastChannel({ name: BROADCAST_CHANNEL.CanvasLang })

    window.host.subscribe({
      topic: 'schemaChange',
      subscriber: 'canvasRenderer',
      callback: throttleUpdateSchema
    })

    window.host.subscribe({
      topic: 'schemaImport',
      subscriber: 'canvasRenderer',
      callback: () => {
        setSchema(window.host.getSchema())
      }
    })

    watch(data, () => {
      locale.value = data.value
    })

    // 这里监听schema.methods，为了保证methods上下文环境始终为最新
    watch(
      () => schema.methods,
      (value) => {
        setMethods(value, true)
      },
      {
        deep: true
      }
    )

    watch(
      () => schema.css,
      (value) => {
        setPageCss(value)
      }
    )

    watch(
      () => schema.state,
      (value) => {
        setState(value)
      },
      {
        deep: true
      }
    )

    const utilsWatchCanceler = window.host.watch(
      () => window.host.appSchema?.utils,
      (data) => {
        setUtils(data)
      },
      {
        immediate: true,
        deep: true
      }
    )

    const dataSourceWatchCanceler = window.host.watch(
      () => window.host.appSchema?.dataSource,
      (data) => {
        setDataSourceMap(data)
      },
      {
        immediate: true,
        deep: true
      }
    )

    const globalStateWatchCanceler = window.host.watch(
      () => window.host.appSchema?.globalState,
      (data) => {
        setGlobalState(data)
      },
      {
        immediate: true,
        deep: true
      }
    )

    onUnmounted(() => {
      window.host.unsubscribe({
        topic: 'schemaChange',
        subscriber: 'canvasRenderer'
      })

      window.host.unsubscribe({
        topic: 'schemaImport',
        subscriber: 'canvasRenderer'
      })

      utilsWatchCanceler()
      dataSourceWatchCanceler()
      globalStateWatchCanceler()
    })
  },

  render() {
    return getRenderer().call(this)
  }
}

export const api = {
  // 用于 lowcode.js 获取 utils 工具类
  getUtils,
  getDataSourceMap,

  // 用于调用区块获取、注册、以及 CanvasCollection 的相关逻辑调用
  setController,
  // 设置物料
  setConfigure,

  // 用于大纲树临时性隐藏
  setCondition,
  getRenderer,
  setRenderer,
  getDesignMode,
  setDesignMode,
  removeBlockCompsCache,
  updateCanvas
}
