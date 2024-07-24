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

import { h, provide, reactive } from 'vue'
import { isHTMLTag, hyphenate } from '@vue/shared'
import { useBroadcastChannel } from '@vueuse/core'
import { constants, utils } from '@opentiny/tiny-engine-utils'
import babelPluginJSX from '@vue/babel-plugin-jsx'
import { transformSync } from '@babel/core'
import i18nHost from '@opentiny/tiny-engine-i18n-host'
import { CanvasRow, CanvasCol, CanvasRowColContainer } from '@opentiny/tiny-engine-builtin-component'
import { context, conditions, setNode } from './context'
import {
  CanvasBox,
  CanvasCollection,
  CanvasIcon,
  CanvasText,
  CanvasSlot,
  CanvasImg,
  CanvasPlaceholder
} from '../builtin'
import { NODE_UID as DESIGN_UIDKEY, NODE_TAG as DESIGN_TAGKEY, NODE_LOOP as DESIGN_LOOPID } from '../common'

const { BROADCAST_CHANNEL } = constants
const { hyphenateRE } = utils
const customElements = {}

const transformJSX = (code) => {
  const res = transformSync(code, {
    plugins: [
      [
        babelPluginJSX,
        {
          pragma: 'h',
          isCustomElement: (name) => customElements[name]
        }
      ]
    ]
  })
  return (res.code || '')
    .replace(/import \{.+\} from "vue";/, '')
    .replace(/h\(_?resolveComponent\((.*?)\)/g, `h(this.getComponent($1)`)
    .replace(/_?resolveComponent/g, 'h')
    .replace(/_?createTextVNode\((.*?)\)/g, '$1')
    .trim()
}

export const blockSlotDataMap = reactive({})

const Mapper = {
  Icon: CanvasIcon,
  Text: CanvasText,
  Collection: CanvasCollection,
  div: CanvasBox,
  Slot: CanvasSlot,
  slot: CanvasSlot,
  Template: CanvasBox,
  Img: CanvasImg,
  CanvasRow,
  CanvasCol,
  CanvasRowColContainer,
  CanvasPlaceholder
}

const { post } = useBroadcastChannel({ name: BROADCAST_CHANNEL.Notify })

// 此处向外层window传递notify配置参数
export const globalNotify = (options) => post(options)

export const collectionMethodsMap = {}

const getNative = (name) => {
  return window.TinyLowcodeComponent?.[name]
}

const getBlock = (name) => {
  return window.blocks?.[name]
}

const configure = {}
const controller = {}

export const setConfigure = (configureData) => {
  Object.assign(configure, configureData)
}

export const setController = (controllerData) => {
  Object.assign(controller, controllerData)
}

export const getController = () => controller

const isI18nData = (data) => {
  return data && data.type === 'i18n'
}

const isJSSlot = (data) => {
  return data && data.type === 'JSSlot'
}

const isJSExpression = (data) => {
  return data && data.type === 'JSExpression'
}

const isJSFunction = (data) => {
  return data && data.type === 'JSFunction'
}

const isJSResource = (data) => {
  return data && data.type === 'JSResource'
}

const isString = (data) => {
  return typeof data === 'string'
}

const isArray = (data) => {
  return Array.isArray(data)
}

const isFunction = (data) => {
  return typeof data === 'function'
}

const isObject = (data) => {
  return typeof data === 'object'
}

// 判断是否是状态访问器
export const isStateAccessor = (stateData) =>
  stateData?.accessor?.getter?.type === 'JSFunction' || stateData?.accessor?.setter?.type === 'JSFunction'

// 规避创建function eslint报错
export const newFn = (...argv) => {
  const Fn = Function
  return new Fn(...argv)
}

const parseExpression = (data, scope, ctx, isJsx = false) => {
  try {
    if (data.value.indexOf('this.i18n') > -1) {
      ctx.i18n = i18nHost.global.t
    } else if (data.value.indexOf('t(') > -1) {
      ctx.t = i18nHost.global.t
    }

    const expression = isJsx ? transformJSX(data.value) : data.value
    return newFn('$scope', `with($scope || {}) { return ${expression} }`).call(ctx, {
      ...ctx,
      ...scope,
      slotScope: scope
    })
  } catch (err) {
    // 解析抛出异常，则再尝试解析 JSX 语法。如果解析 JSX 语法仍然出现错误，isJsx 变量会确保不会再次递归执行解析
    if (!isJsx) {
      return parseExpression(data, scope, ctx, true)
    }
    return undefined
  }
}

const parseI18n = (i18n, scope, ctx) => {
  return parseExpression(
    {
      type: 'JSExpression',
      value: `this.i18n('${i18n.key}', ${JSON.stringify(i18n.params)})`
    },
    scope,
    { i18n: i18nHost.global.t, ...ctx }
  )
}

const renderDefault = (children, scope, parent) =>
  children.map?.((child) =>
    // eslint-disable-next-line no-use-before-define
    h(renderer, {
      schema: child,
      scope,
      parent
    })
  )

const parseJSSlot = (data, scope) => {
  return ($scope) => renderDefault(data.value, { ...scope, ...$scope }, data)
}

export const generateFn = (innerFn, context) => {
  return (...args) => {
    // 如果有数据源标识，则表格的fetchData返回数据源的静态数据
    const sourceId = collectionMethodsMap[innerFn.realName || innerFn.name]
    if (sourceId) {
      return innerFn.call(context, ...args)
    } else {
      let result = null

      // 这里是为了兼容用户写法报错导致画布异常，但无法捕获promise内部的异常
      try {
        result = innerFn.call(context, ...args)
      } catch (error) {
        globalNotify({
          type: 'warning',
          title: `函数:${innerFn.name}执行报错`,
          message: error?.message || `函数:${innerFn.name}执行报错，请检查语法`
        })
      }

      // 这里注意如果innerFn返回的是一个promise则需要捕获异常，重新返回默认一条空数据
      if (result.then) {
        result = new Promise((resolve) => {
          result.then(resolve).catch((error) => {
            globalNotify({
              type: 'warning',
              title: '异步函数执行报错',
              message: error?.message || '异步函数执行报错，请检查语法'
            })
            // 这里需要至少返回一条空数据，方便用户使用表格默认插槽
            resolve({
              result: [{}],
              page: { total: 1 }
            })
          })
        })
      }

      return result
    }
  }
}

// 解析函数字符串结构
const parseFunctionString = (fnStr) => {
  const fnRegexp = /(async)?.*?(\w+) *\(([\s\S]*?)\) *\{([\s\S]*)\}/
  const result = fnRegexp.exec(fnStr)
  if (result) {
    return {
      type: result[1] || '',
      name: result[2],
      params: result[3]
        .split(',')
        .map((item) => item.trim())
        .filter((item) => Boolean(item)),
      body: result[4]
    }
  }
  return null
}

const getPlainProps = (object = {}) => {
  const { slot, ...rest } = object
  const props = {}

  if (slot) {
    rest.slot = slot.name || slot
  }

  Object.entries(rest).forEach(([key, value]) => {
    let renderKey = key

    // html 标签属性会忽略大小写，所以传递包含大写的 props 需要转换为 kebab 形式的 props
    if (!/on[A-Z]/.test(renderKey) && hyphenateRE.test(renderKey)) {
      renderKey = hyphenate(renderKey)
    }

    if (['boolean', 'string', 'number'].includes(typeof value)) {
      props[renderKey] = value
    } else {
      // 如果传给webcomponent标签的是对象或者数组需要使用.prop修饰符，转化成h函数就是如下写法
      props[`.${renderKey}`] = value
    }
  })
  return props
}

const generateCollection = (schema) => {
  if (schema.componentName === 'Collection' && schema.props?.dataSource && schema.children) {
    schema.children.forEach((item) => {
      const fetchData = item.props?.fetchData
      const methodMatch = fetchData?.value?.match(/this\.(.+?)}/)
      if (fetchData && methodMatch?.[1]) {
        const methodName = methodMatch[1].trim()
        // 缓存表格fetchData对应的数据源信息
        collectionMethodsMap[methodName] = schema.props.dataSource
      }
    })
  }
}

const generateBlockContent = (schema) => {
  if (schema?.componentName === 'Collection') {
    generateCollection(schema)
  }
  if (Array.isArray(schema?.children)) {
    schema.children.forEach((item) => {
      generateBlockContent(item)
    })
  }
}

const registerBlock = (componentName) => {
  getController()
    .registerBlock?.(componentName)
    .then((res) => {
      const blockSchema = res.content

      // 拿到区块数据，建立区块中数据源的映射关系
      generateBlockContent(blockSchema)

      // 如果区块的根节点有百分比高度，则需要特殊处理，把高度百分比传递下去,适配大屏应用
      if (/height:\s*?[\d|.]+?%/.test(blockSchema?.props?.style)) {
        const blockDoms = document.querySelectorAll(hyphenate(componentName))
        blockDoms.forEach((item) => {
          item.style.height = '100%'
        })
      }
    })
}

export const wrapCustomElement = (componentName) => {
  const material = getController().getMaterial(componentName)

  if (!Object.keys(material).length) {
    registerBlock(componentName)
  }

  customElements[componentName] = {
    name: componentName + '.ce',
    render() {
      return h(
        hyphenate(componentName),
        window.parent.TinyGlobalConfig.dslMode === 'Vue' ? getPlainProps(this.$attrs) : this.$attrs,
        this.$slots.default?.()
      )
    }
  }

  return customElements[componentName]
}

export const getComponent = (name) => {
  return (
    Mapper[name] ||
    getNative(name) ||
    getBlock(name) ||
    customElements[name] ||
    (isHTMLTag(name) ? name : wrapCustomElement(name))
  )
}

// 解析JSX字符串为可执行函数
const parseJSXFunction = (data, ctx) => {
  try {
    const newValue = transformJSX(data.value)
    const fnInfo = parseFunctionString(newValue)
    if (!fnInfo) throw Error('函数解析失败，请检查格式。示例：function fnName() { }')

    return newFn(...fnInfo.params, fnInfo.body).bind({
      ...ctx,
      getComponent
    })
  } catch (error) {
    globalNotify({
      type: 'warning',
      title: '函数声明解析报错',
      message: error?.message || '函数声明解析报错，请检查语法'
    })

    return newFn()
  }
}

const parseJSFunction = (data, scope, ctx = context) => {
  try {
    const innerFn = newFn(`return ${data.value}`).bind(ctx)()
    return generateFn(innerFn, ctx)
  } catch (error) {
    return parseJSXFunction(data, ctx)
  }
}

const parseList = []

export function parseData(data, scope, ctx = context) {
  let res = data
  parseList.some((item) => {
    if (item.type(data)) {
      res = item.parseFunc(data, scope, ctx)

      return true
    }

    return false
  })

  return res
}

const parseCondition = (condition, scope, ctx = context) => {
  // eslint-disable-next-line no-eq-null
  return condition == null ? true : parseData(condition, scope, ctx)
}

const parseLoopArgs = (_loop) => {
  if (_loop) {
    const { item, index, loopArgs = '' } = _loop
    const body = `return {${loopArgs[0] || 'item'}: item, ${loopArgs[1] || 'index'} : index }`
    return newFn('item,index', body)(item, index)
  }
  return undefined
}

export const getIcon = (name) => window.TinyVueIcon?.[name]?.() || ''

const parseObjectData = (data, scope, ctx) => {
  if (!data) {
    return data
  }

  // 如果是状态访问器,则直接解析默认值
  if (isStateAccessor(data)) {
    return parseData(data.defaultValue)
  }

  // 解析通过属性传递icon图标组件
  if (data.componentName === 'Icon') {
    return getIcon(data.props.name)
  }
  const res = {}
  Object.entries(data).forEach(([key, value]) => {
    // 如果是插槽则需要进行特殊处理
    if (key === 'slot' && value?.name) {
      res[key] = value.name
    } else {
      res[key] = parseData(value, scope, ctx)
    }
  })
  return res
}

const parseString = (data) => {
  return data.trim()
}

const parseArray = (data, scope, ctx) => {
  return data.map((item) => parseData(item, scope, ctx))
}

const parseFunction = (data, scope, ctx) => {
  return data.bind(ctx)
}

parseList.push(
  ...[
    {
      type: isJSExpression,
      parseFunc: parseExpression
    },
    {
      type: isI18nData,
      parseFunc: parseI18n
    },
    {
      type: isJSFunction,
      parseFunc: parseJSFunction
    },
    {
      type: isJSResource,
      parseFunc: parseExpression
    },
    {
      type: isJSSlot,
      parseFunc: parseJSSlot
    },
    {
      type: isString,
      parseFunc: parseString
    },
    {
      type: isArray,
      parseFunc: parseArray
    },
    {
      type: isFunction,
      parseFunc: parseFunction
    },
    {
      type: isObject,
      parseFunc: parseObjectData
    }
  ]
)

const stopEvent = (event) => {
  event.preventDefault?.()
  event.stopPropagation?.()
  return false
}

const generateSlotGroup = (children, isCustomElm, schema) => {
  const slotGroup = {}

  children.forEach((child) => {
    const { componentName, children, params = [], props } = child
    const slot = child.slot || props?.slot?.name || props?.slot || 'default'
    const isNotEmptyTemplate = componentName === 'Template' && children.length

    isCustomElm && (child.props.slot = 'slot') // CE下需要给子节点加上slot标识
    slotGroup[slot] = slotGroup[slot] || {
      value: [],
      params,
      parent: isNotEmptyTemplate ? child : schema
    }

    slotGroup[slot].value.push(...(isNotEmptyTemplate ? children : [child])) // template 标签直接过滤掉
  })

  return slotGroup
}

const renderSlot = (children, scope, schema, isCustomElm) => {
  if (children.some((a) => a.componentName === 'Template')) {
    const slotGroup = generateSlotGroup(children, isCustomElm, schema)
    const slots = {}

    Object.keys(slotGroup).forEach((slotName) => {
      const currentSlot = slotGroup[slotName]

      slots[slotName] = ($scope) => renderDefault(currentSlot.value, { ...scope, ...$scope }, currentSlot.parent)
    })

    return slots
  }

  return { default: () => renderDefault(children, scope, schema) }
}

const checkGroup = (componentName) => configure[componentName]?.nestingRule?.childWhitelist?.length

const clickCapture = (componentName) => configure[componentName]?.clickCapture !== false

const getBindProps = (schema, scope) => {
  const { id, componentName } = schema
  const invalidity = configure[componentName]?.invalidity || []

  if (componentName === 'CanvasPlaceholder') {
    return {}
  }

  const bindProps = {
    ...parseData(schema.props, scope),
    [DESIGN_UIDKEY]: id,
    [DESIGN_TAGKEY]: componentName,
    onMouseover: stopEvent,
    onFocus: stopEvent
  }
  if (scope) {
    bindProps[DESIGN_LOOPID] = scope.index === undefined ? scope.idx : scope.index
  }

  // 在捕获阶段阻止事件的传播
  if (clickCapture(componentName)) {
    bindProps.onClickCapture = stopEvent
  }

  if (Mapper[componentName]) {
    bindProps.schema = schema
  }

  // 绑定组件属性时需要将 className 重命名为 class，防止覆盖组件内置 class
  bindProps.class = bindProps.className
  delete bindProps.className

  // 使画布中元素可拖拽
  bindProps.draggable = true

  // 过滤在门户网站上配置的画布丢弃的属性
  invalidity.forEach((prop) => delete bindProps[prop])

  return bindProps
}

const getLoopScope = ({ scope, index, item, loopArgs }) => {
  return {
    ...scope,
    ...(parseLoopArgs({
      item,
      index,
      loopArgs
    }) || {})
  }
}

const injectPlaceHolder = (componentName, children) => {
  const isEmptyArr = Array.isArray(children) && !children.length

  if (configure[componentName]?.isContainer && (!children || isEmptyArr)) {
    return [
      {
        componentName: 'CanvasPlaceholder'
      }
    ]
  }

  return children
}

const renderGroup = (children, scope, parent) => {
  return children.map?.((schema) => {
    const { componentName, children, loop, loopArgs, condition, id } = schema
    const loopList = parseData(loop, scope)

    const renderElement = (item, index) => {
      const mergeScope = getLoopScope({
        scope,
        index,
        item,
        loopArgs
      })

      setNode(schema, parent)

      if (conditions[id] === false || !parseCondition(condition, mergeScope)) {
        return null
      }

      const renderChildren = injectPlaceHolder(componentName, children)

      return h(
        getComponent(componentName),
        getBindProps(schema, mergeScope),
        Array.isArray(renderChildren)
          ? renderSlot(renderChildren, mergeScope, schema)
          : parseData(renderChildren, mergeScope)
      )
    }

    return loopList?.length ? loopList.map(renderElement) : renderElement()
  })
}

const getChildren = (schema, mergeScope) => {
  const { componentName, children } = schema
  const renderChildren = injectPlaceHolder(componentName, children)

  const component = getComponent(componentName)
  const isNative = typeof component === 'string'
  const isCustomElm = customElements[componentName]
  const isGroup = checkGroup(componentName)

  if (Array.isArray(renderChildren)) {
    if (isNative || isCustomElm) {
      return renderDefault(renderChildren, mergeScope, schema)
    } else {
      return isGroup
        ? renderGroup(renderChildren, mergeScope, schema)
        : renderSlot(renderChildren, mergeScope, schema, isCustomElm)
    }
  } else {
    return parseData(renderChildren, mergeScope)
  }
}

export const renderer = {
  name: 'renderer',
  props: {
    schema: Object,
    scope: Object,
    parent: Object
  },
  setup(props) {
    provide('schema', props.schema)
  },
  render() {
    const { scope, schema, parent } = this
    const { componentName, loop, loopArgs, condition } = schema

    // 处理数据源和表格fetchData的映射关系
    generateCollection(schema)

    if (!componentName) {
      return parseData(schema, scope)
    }

    const component = getComponent(componentName)

    const loopList = parseData(loop, scope)

    const renderElement = (item, index) => {
      let mergeScope = item
        ? getLoopScope({
            item,
            index,
            loopArgs,
            scope
          })
        : scope

      // 如果是区块，并且使用了区块的作用域插槽，则需要将作用域插槽的数据传递下去
      if (parent?.componentType === 'Block' && componentName === 'Template' && schema.props?.slot?.params?.length) {
        const slotName = schema.props.slot?.name || schema.props.slot
        const blockName = parent.componentName
        const slotData = blockSlotDataMap[blockName]?.[slotName] || {}
        mergeScope = mergeScope ? { ...mergeScope, ...slotData } : slotData
      }

      // 给每个节点设置schema.id，并缓存起来
      setNode(schema, parent)

      if (conditions[schema.id] === false || !parseCondition(condition, mergeScope)) {
        return null
      }

      return h(component, getBindProps(schema, mergeScope), getChildren(schema, mergeScope))
    }

    return loopList?.length ? loopList.map(renderElement) : renderElement()
  }
}

export default renderer
