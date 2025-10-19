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

import {
  h,
  provide,
  inject,
  defineComponent,
  onBeforeMount,
  onMounted,
  onBeforeUpdate,
  onUpdated,
  onBeforeUnmount,
  onUnmounted,
  onErrorCaptured,
  onActivated,
  onDeactivated
} from 'vue'
import { Notify } from '@opentiny/vue'
import { isHTMLTag, hyphenate } from '@vue/shared'
import TinyVue from '@opentiny/vue'
import { getBlockContext } from './page-function/blockContext'
import {
  CanvasRow,
  CanvasCol,
  CanvasRowColContainer,
  CanvasFlexBox,
  CanvasSection
} from '@opentiny/tiny-engine-builtin-component'
import {
  CanvasIcon,
  CanvasText,
  CanvasSlot,
  CanvasImg,
  CanvasPlaceholder,
  CanvasRouterLink,
  CanvasRouterView,
  CanvasCollection
} from './builtin'
import { parseData, parseCondition, parseLoopArgs } from './parser'

const hyphenateRE = /\B([A-Z])/g
const customElements = {}

const Mapper = {
  Icon: CanvasIcon,
  Text: CanvasText,
  Slot: CanvasSlot,
  slot: CanvasSlot,
  Img: CanvasImg,
  CanvasRow,
  CanvasCol,
  CanvasRowColContainer,
  CanvasFlexBox,
  CanvasSection,
  CanvasPlaceholder,
  RouterLink: CanvasRouterLink,
  RouterView: CanvasRouterView,
  Collection: CanvasCollection
}

export const collectionMethodsMap = {}

const getNative = (name) => {
  return TinyVue?.[name] || window.TinyLowcodeComponent?.[name]
}

const getBlock = (name) => {
  return window.blocks?.[name]
}

export const getComponent = (name) => {
  // 首先尝试从映射表、原生组件、自定义元素中获取
  const component = Mapper[name] || getNative(name) || customElements[name]
  if (component) {
    return component
  }

  if (name === 'Template') {
    return 'div'
  }

  // 如果是 HTML 标签，直接返回
  if (isHTMLTag(name)) {
    return name
  }

  // 检查是否是区块组件
  const blockSchema = getBlock(name)
  if (blockSchema) {
    // 返回一个动态组件，用于渲染区块
    return defineComponent({
      name: `${name}`,
      setup() {
        // 区块的真实内容在 window.blocks 中，而不是页面的 schema 中
        // 页面的 schema 只是区块的引用，children 为空
        const blockContent = blockSchema.schema

        const context = getBlockContext(blockContent)

        return {
          context
        }
      },
      render() {
        // 递归渲染区块的 children
        const blockContent = blockSchema.schema
        const context = this.context

        // eslint-disable-next-line
        return renderGroup(blockContent.children, {}, context, renderComponent)
      }
    })
  }

  return CanvasPlaceholder
}

const configure = {}

export const setConfigure = (configureData) => {
  Object.assign(configure, configureData)
}

const _getPlainProps = (object = {}) => {
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

const renderDefault = (
  children: any[],
  scope: Record<string, any>,
  parent: any,
  renderComponent: (schema: any, scope: Record<string, any>, parent: any) => any
) => children.map?.((child) => renderComponent(child, scope, parent))

const generateSlotGroup = (children, isCustomElm, schema) => {
  const slotGroup = {}

  children.forEach((child) => {
    const { componentName, children, params = [], props } = child
    const slot = child.slot || props?.slot?.name || props?.slot || 'default'
    const isNotEmptyTemplate = componentName === 'Template' && children.length

    if (isCustomElm) {
      child.props.slot = 'slot' // CE下需要给子节点加上slot标识
    }
    slotGroup[slot] = slotGroup[slot] || {
      value: [],
      params,
      parent: isNotEmptyTemplate ? child : schema
    }

    slotGroup[slot].value.push(...(isNotEmptyTemplate ? children : [child])) // template 标签直接过滤掉
  })

  return slotGroup
}

const renderSlot = (children, scope, schema, isCustomElm, context, renderComponent) => {
  if (children.some((a) => a.componentName === 'Template')) {
    const slotGroup = generateSlotGroup(children, isCustomElm, schema)
    const slots = {}

    Object.keys(slotGroup).forEach((slotName) => {
      const currentSlot = slotGroup[slotName]

      slots[slotName] = ($scope) => renderDefault(currentSlot.value, { ...scope, ...$scope }, context, renderComponent)
    })

    return slots
  }

  return { default: () => renderDefault(children, scope, context, renderComponent) }
}

const _checkGroup = (componentName) => configure[componentName]?.nestingRule?.childWhitelist?.length

const directChildrenHasTemplate = (children) => children.some((child) => child.componentName === 'Template')

const getBindProps = (schema, scope, context) => {
  const { componentName } = schema

  if (componentName === 'CanvasPlaceholder') {
    return {}
  }

  const bindProps = {
    ...parseData(schema.props, scope, context)
  }

  if (Mapper[componentName]) {
    bindProps.schema = schema
  }

  // 如果是区块组件，传递完整的 schema
  const blockSchema = getBlock(componentName)
  if (blockSchema) {
    bindProps.schema = schema
  }

  // 绑定组件属性时需要将 className 重命名为 class，防止覆盖组件内置 class
  bindProps.class = bindProps.className
  delete bindProps.className

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

const renderGroup = (children, scope, context, renderComponent) => {
  return children.map?.((schema) => {
    const { componentName, children, loop, loopArgs, condition } = schema
    const loopList = parseData(loop, scope, context)

    const renderElement = (item, index) => {
      const mergeScope = getLoopScope({
        scope,
        index,
        item,
        loopArgs
      })

      if (!parseCondition(condition, mergeScope, context)) {
        return null
      }

      const renderChildren = injectPlaceHolder(componentName, children)

      const element = h(
        getComponent(componentName),
        getBindProps(schema, mergeScope, context),
        Array.isArray(renderChildren)
          ? renderSlot(renderChildren, mergeScope, schema, customElements[componentName], context, renderComponent)
          : parseData(renderChildren, mergeScope, context)
      )

      return element
    }

    return loopList?.length ? loopList.map(renderElement) : renderElement(undefined, 0)
  })
}

const getChildren = (schema, mergeScope, context, renderComponent) => {
  const { componentName, children } = schema
  const renderChildren = injectPlaceHolder(componentName, children)

  if (!Array.isArray(renderChildren)) {
    return parseData(renderChildren, mergeScope, context)
  }

  if (!renderChildren.length) {
    return null
  }

  const isCustomElm = customElements[componentName]

  if (directChildrenHasTemplate(renderChildren)) {
    return renderSlot(renderChildren, mergeScope, schema, isCustomElm, context, renderComponent)
  }

  return renderGroup(renderChildren, mergeScope, context, renderComponent)
}

function renderComponent(schema, scope, parent) {
  const { componentName, loop, loopArgs, condition } = schema
  //console.log('renderComponent', schema)

  // 处理数据源和表格fetchData的映射关系
  generateCollection(schema)

  if (!componentName) {
    return parseData(schema, scope, parent)
  }

  const component = getComponent(componentName)

  const loopList = parseData(loop, scope, parent)

  const renderElement = (item, index) => {
    const mergeScope = item
      ? getLoopScope({
          item,
          index,
          loopArgs,
          scope
        })
      : scope

    if (!parseCondition(condition, mergeScope, parent)) {
      return null
    }

    const Ele = h(
      component,
      getBindProps(schema, mergeScope, parent),
      getChildren(schema, mergeScope, parent, renderComponent)
    )

    return Ele
  }

  return loopList?.length ? loopList.map(renderElement) : renderElement(undefined, 0)
}

// 执行用户定义的生命周期函数
const executeUserLifecycle = (hookName: string, lifeCycleConfig: JSFunction | undefined, context: any) => {
  if (!lifeCycleConfig || lifeCycleConfig.type !== 'JSFunction') {
    return
  }

  try {
    const fn = parseData(lifeCycleConfig, {}, context)
    if (typeof fn === 'function') {
      fn.call(context, context)
    }
  } catch (error) {
    Notify({
      type: 'warning',
      title: `${hookName} 生命周期执行失败`,
      message: (error as any)?.message || `${hookName} 生命周期函数执行报错，请检查语法`
    })
  }
}

export const renderer = defineComponent({
  name: 'renderer',
  props: {
    schema: Object,
    scope: Object,
    parent: Object
  },
  setup(props) {
    provide('schema', props.schema)

    const context = inject('pageContext')
    const lifeCycles = props.parent?.lifeCycles

    // 注入生命周期钩子
    if (lifeCycles?.setup) {
      executeUserLifecycle('setup', lifeCycles?.setup, context)
    }

    if (lifeCycles?.onBeforeMount) {
      onBeforeMount(() => {
        executeUserLifecycle('onBeforeMount', lifeCycles.onBeforeMount, context)
      })
    }

    if (lifeCycles?.onMounted) {
      onMounted(() => {
        executeUserLifecycle('onMounted', lifeCycles.onMounted, context)
      })
    }

    if (lifeCycles?.onBeforeUpdate) {
      onBeforeUpdate(() => {
        executeUserLifecycle('onBeforeUpdate', lifeCycles.onBeforeUpdate, context)
      })
    }

    if (lifeCycles?.onUpdated) {
      onUpdated(() => {
        executeUserLifecycle('onUpdated', lifeCycles.onUpdated, context)
      })
    }

    if (lifeCycles?.onBeforeUnmount) {
      onBeforeUnmount(() => {
        executeUserLifecycle('onBeforeUnmount', lifeCycles.onBeforeUnmount, context)
      })
    }

    if (lifeCycles?.onUnmounted) {
      onUnmounted(() => {
        executeUserLifecycle('onUnmounted', lifeCycles.onUnmounted, context)
      })
    }

    if (lifeCycles?.onErrorCaptured) {
      onErrorCaptured((error, instance, info) => {
        try {
          const fn = parseData(lifeCycles.onErrorCaptured, {}, context)
          if (typeof fn === 'function') {
            const result = fn.call(context, error, instance, info)
            return result === false
          }
        } catch (userError) {
          Notify({
            type: 'warning',
            title: 'onErrorCaptured 生命周期执行失败',
            message: (userError as any)?.message || 'onErrorCaptured 生命周期函数执行报错，请检查语法'
          })
        }
        return true
      })
    }

    if (lifeCycles?.onActivated) {
      onActivated(() => {
        executeUserLifecycle('onActivated', lifeCycles.onActivated, context)
      })
    }

    if (lifeCycles?.onDeactivated) {
      onDeactivated(() => {
        executeUserLifecycle('onDeactivated', lifeCycles.onDeactivated, context)
      })
    }
  },
  render() {
    const context = inject('pageContext')
    const { scope, schema } = this

    return renderComponent(schema, scope, context, renderComponent)
  }
})

export default renderer
