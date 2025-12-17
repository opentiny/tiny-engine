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

import { defineComponent, h, inject, provide, Suspense } from 'vue'
import { registerLifecycleHooks } from './page-function/index.ts'
import { NODE_TAG, NODE_LOOP, NODE_UID } from './app-function/constant.ts'
import { parseCondition, parseData, parseLoopArgs } from './data-function/index.ts'
import { blockSlotDataMap, getComponent, Mapper } from './material-function/index.ts'
import Loading from '../components/Loading.vue'
import BlockLoading from '../components/BlockLoading.vue'
import type { Node } from '../types/index.ts'

export const renderDefault = (children: Node[], scope: Record<string, any>, parent: Node) =>
  children.map?.((child) =>
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    h(renderer, {
      schema: child,
      scope,
      parent
    })
  )

const generateSlotGroup = (children: Node[], schema: Node) => {
  const slotGroup: Record<string, any> = {}

  children.forEach((child) => {
    const { componentName, children, params = [], props } = child
    const slot = child.slot || props?.slot?.name || props?.slot || 'default'
    const isNotEmptyTemplate = componentName === 'Template' && children?.length

    slotGroup[slot] = slotGroup[slot] || {
      value: [],
      params,
      parent: isNotEmptyTemplate ? child : schema
    }

    slotGroup[slot].value.push(...(isNotEmptyTemplate ? children : [child])) // template 标签直接过滤掉
  })

  return slotGroup
}

const directChildrenHasTemplate = (children: Node[]) => children.some((child) => child.componentName === 'Template')

const renderSlot = (
  children: Node[],
  scope: Record<string, any>,
  schema: Node,
  pageContext: Record<string, any>,
  renderComponent: (schema: Node, scope: Record<string, any>, pageContext: Record<string, any>, parent: Node) => any
) => {
  const slotGroup = generateSlotGroup(children, schema)
  const slots: Record<string, any> = {}
  Object.keys(slotGroup).forEach((slotName) => {
    const currentSlot = slotGroup[slotName]
    slots[slotName] = ($scope: Record<string, any>) =>
      currentSlot.value.map((slotItem: Node) =>
        renderComponent(slotItem, { ...scope, ...$scope }, pageContext, currentSlot.parent)
      )
  })

  return slots
}

const getBindProps = (
  schema: Node,
  scope: Record<string, any>,
  context: Record<string, any>,
  pageContext: Record<string, any>
) => {
  const { id, componentName, componentType } = schema

  if (componentName === 'CanvasPlaceholder') {
    return {}
  }
  const { active, getCssScopeId } = pageContext || {}
  const cssScopeId = getCssScopeId?.()
  const bindProps = {
    ...parseData(schema.props, scope, context),
    ...(cssScopeId ? { [cssScopeId]: '' } : {}),
    ...{ [NODE_UID]: id },
    [NODE_TAG]: componentName
  }

  if (scope) {
    bindProps[NODE_LOOP] = scope.index === undefined ? scope.idx : scope.index
  }

  if (Mapper[componentName as keyof typeof Mapper]) {
    bindProps.schema = schema
  }

  // 绑定组件属性时需要将 className 重命名为 class，防止覆盖组件内置 class
  bindProps.class = bindProps.className
  delete bindProps.className

  // 使画布中元素可拖拽
  if (active && !['PageStart', 'PageSection'].includes(componentType || '')) {
    bindProps.draggable = true
  }

  return bindProps
}

const getLoopScope = ({
  scope,
  index,
  item,
  loopArgs
}: {
  scope: Record<string, any>
  index: number
  item: any
  loopArgs: any
}) => {
  return {
    ...scope,
    ...(parseLoopArgs({
      item,
      index,
      loopArgs
    }) || {})
  }
}

const getChildren = (
  schema: Node,
  mergeScope: Record<string, any>,
  pageContext: Record<string, any>,
  parent: Node,
  renderComponent: (schema: Node, scope: Record<string, any>, pageContext: Record<string, any>, parent: Node) => any
) => {
  const { children = [] } = schema
  const renderChildren = children as Node[]

  if (Array.isArray(renderChildren)) {
    // children 空的场景，不能返回空数组，因为有部分组件会误以为使用了自定义插槽，从而无法渲染默认插槽内容，比如 TinyTree 组件
    if (!renderChildren.length) {
      return null
    }

    if (directChildrenHasTemplate(renderChildren)) {
      return renderSlot(renderChildren, mergeScope, schema, pageContext, renderComponent)
    }

    // 这里 children 需要返回一个默认插槽的函数，避免 vue 告警：
    // Non-function value encountered for default slot. Prefer function slots for better performance.
    return {
      default: () => renderChildren.map((child) => renderComponent(child, mergeScope, pageContext, parent))
    }
  }

  return parseData(renderChildren, mergeScope, pageContext)
}

const renderComponent = (schema: Node, scope: Record<string, any>, pageContext: Record<string, any>, parent: Node) => {
  const { componentName, loop, loopArgs, condition } = schema as any

  if (!componentName) {
    return parseData(schema, scope, pageContext)
  }

  const loopList = loop ? parseData(loop, scope, pageContext) : []

  const renderElement = (item?: Node, index: number = 0) => {
    let mergeScope = item
      ? getLoopScope({
          scope,
          index,
          item,
          loopArgs
        })
      : scope

    if (!parseCondition(condition, mergeScope, pageContext)) {
      return null
    }
    // 如果是区块，并且使用了区块的作用域插槽，则需要将作用域插槽的数据传递下去
    if (parent?.componentType === 'Block' && componentName === 'Template' && schema.props?.slot?.params?.length) {
      const slotName = schema.props.slot?.name || schema.props.slot
      const blockName = parent.componentName
      const slotData = blockSlotDataMap[blockName]?.[slotName] || {}
      mergeScope = mergeScope ? { ...mergeScope, ...slotData } : slotData
    }

    const Ele = h(
      getComponent(componentName),
      getBindProps(schema, mergeScope, pageContext, pageContext),
      getChildren(schema, mergeScope, pageContext, parent, renderComponent)
    )

    // 区块加上 suspense 渲染，就可以在网络延时的时候显示加载中的字样或者动画，优化体验
    if (schema.componentType === 'Block') {
      return h(
        Suspense,
        {},
        {
          default: () => Ele,
          fallback: () => h(BlockLoading, { name: componentName })
        }
      )
    }

    return Ele
  }

  return loopList?.length ? loopList.map(renderElement) : renderElement()
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
    const pageContext = inject('pageContext') || {}
    const lifeCycles = props.parent?.lifeCycles
    registerLifecycleHooks(lifeCycles, pageContext)
    return { pageContext }
  },
  render() {
    const { scope = {}, schema, parent, pageContext } = this
    return renderComponent(schema as Node, scope, pageContext, parent as Node)
  }
})

export function defaultRenderer(schema: Node) {
  const PageStartSchema = {
    componentName: 'div',
    componentType: 'PageStart',
    props: { 'data-id': 'page-root-container', ...(schema.props || {}) },
    children: schema.children
  }
  return schema.children?.length ? h(renderer, { schema: PageStartSchema, parent: schema }) : [h(Loading)]
}
