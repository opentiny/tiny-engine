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

import { defineComponent, h, inject, provide, type Ref, Suspense } from 'vue'
import {
  NODE_UID as DESIGN_UIDKEY,
  NODE_TAG as DESIGN_TAGKEY,
  NODE_LOOP as DESIGN_LOOPID,
  NODE_INACTIVE_UID
} from '../../common'
import { getDesignMode, DESIGN_MODE } from './canvas-function'
import { parseCondition, parseData, parseLoopArgs } from './data-function'
import { blockSlotDataMap, getComponent, Mapper, configure } from './material-function'
import { getPage } from './material-function/page-getter'
import BlockLoading from './BlockLoading.vue'
import type { Node } from '../../types'

export const renderDefault = (children: Node[], scope: Record<string, any>, parent: Node) =>
  children.map?.((child) =>
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    h(renderer, {
      schema: child,
      scope,
      parent
    })
  )

const stopEvent = (event: Event) => {
  event.preventDefault?.()
  event.stopPropagation?.()
  return false
}

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
  ancestors: any[],
  renderComponent: (
    schema: Node,
    scope: Record<string, any>,
    pageContext: Record<string, any>,
    parent: Node,
    ancestors: any[]
  ) => any
) => {
  const slotGroup = generateSlotGroup(children, schema)
  const slots: Record<string, any> = {}

  Object.keys(slotGroup).forEach((slotName) => {
    const currentSlot = slotGroup[slotName]

    slots[slotName] = ($scope: Record<string, any>) =>
      currentSlot.value.map((slotItem: Node) =>
        renderComponent(slotItem, { ...scope, ...$scope }, pageContext, currentSlot.parent, ancestors)
      )
  })

  return slots
}

const clickCapture = (componentName: string) => configure[componentName]?.clickCapture !== false

const getBindProps = (
  schema: Node,
  scope: Record<string, any>,
  context: Record<string, any>,
  pageContext: Record<string, any>
) => {
  const { id, componentName, componentType } = schema
  const invalidity = configure[componentName]?.invalidity || []

  if (componentName === 'CanvasPlaceholder') {
    return {}
  }
  const { active, getCssScopeId } = pageContext || {}
  const cssScopeId = getCssScopeId?.()
  const bindProps = {
    ...parseData(schema.props, scope, context),
    ...(cssScopeId ? { [cssScopeId]: '' } : {}),
    ...(active ? { [DESIGN_UIDKEY]: id } : { [NODE_INACTIVE_UID]: id }),
    [DESIGN_TAGKEY]: componentName
  }

  if (getDesignMode() === DESIGN_MODE.DESIGN && active) {
    bindProps.onMouseover = stopEvent
    bindProps.onFocus = stopEvent
  }

  if (scope) {
    bindProps[DESIGN_LOOPID] = scope.index === undefined ? scope.idx : scope.index
  }

  // 在捕获阶段阻止事件的传播
  if (clickCapture(componentName) && getDesignMode() === DESIGN_MODE.DESIGN && active) {
    bindProps.onClickCapture = stopEvent
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

  // 过滤在门户网站上配置的画布丢弃的属性
  invalidity.forEach((prop: string) => delete bindProps[prop])

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

const injectPlaceHolder = (componentName: string, children: Node[]) => {
  const isEmptyArr = Array.isArray(children) && !children.length

  if ((configure[componentName]?.isContainer || componentName === 'Template') && (!children || isEmptyArr)) {
    return [
      {
        componentName: 'CanvasPlaceholder'
      }
    ]
  }

  return children
}

const getChildren = (
  schema: Node,
  mergeScope: Record<string, any>,
  pageContext: Record<string, any>,
  parent: Node,
  renderComponent: (
    schema: Node,
    scope: Record<string, any>,
    pageContext: Record<string, any>,
    parent: Node,
    ancestors: any[]
  ) => any,
  ancestors: any[]
) => {
  const { componentName, children } = schema
  const renderChildren = (
    pageContext?.active ? injectPlaceHolder(componentName, children || []) : children || []
  ) as Node[]

  if (Array.isArray(renderChildren)) {
    // children 空的场景，不能返回空数组，因为有部分组件会误以为使用了自定义插槽，从而无法渲染默认插槽内容，比如 TinyTree 组件
    if (!renderChildren.length) {
      return null
    }

    if (directChildrenHasTemplate(renderChildren)) {
      return renderSlot(renderChildren, mergeScope, schema, pageContext, ancestors, renderComponent)
    }

    // 这里 children 需要返回一个默认插槽的函数，避免 vue 告警：
    // Non-function value encountered for default slot. Prefer function slots for better performance.
    return {
      default: () => renderChildren.map((child) => renderComponent(child, mergeScope, pageContext, parent, ancestors))
    }
  }

  return parseData(renderChildren, mergeScope, pageContext?.context)
}

function getRenderPageId(currentPageId: string, isPageStart: boolean) {
  const pagePathFromRoot = (inject('page-ancestors') as Ref<any[]>).value
  const pagePreviewFromCurrentPageChild = (inject('page-preview') as Ref<any[]>).value
  const fullPath = [...pagePathFromRoot, ...pagePreviewFromCurrentPageChild]

  function getNextChild(currentPageId: string) {
    const index = fullPath.indexOf(currentPageId)
    if (index > -1 && index + 1 < fullPath.length) {
      return fullPath[index + 1]
    }
    return null
  }
  return isPageStart ? pagePathFromRoot[0] : getNextChild(currentPageId)
}

const renderComponent = (
  schema: Node,
  scope: Record<string, any>,
  pageContext: Record<string, any>,
  parent: Node,
  ancestors: any[]
) => {
  const { componentName, loop, loopArgs, condition, id } = schema

  if (!componentName) {
    return parseData(schema, scope, pageContext.context)
  }

  const isPageStart = schema.componentType === 'PageStart'
  const isRouterView = componentName === 'RouterView'

  if (ancestors?.length && (isPageStart || isRouterView)) {
    const renderPageId = getRenderPageId(pageContext.pageId, isPageStart)
    if (renderPageId) {
      return h(getPage(renderPageId), {
        key: ancestors.join('-'),
        [DESIGN_TAGKEY]: `${componentName}`,
        'data-te-page-id': pageContext.pageId,
        ...(pageContext.active && !isPageStart
          ? {
              [DESIGN_UIDKEY]: schema.id,
              draggable: true
            }
          : {})
      })
    }
  }

  const loopList = loop ? parseData(loop, scope, pageContext.context) : []

  const renderElement = (item?: Node, index: number = 0) => {
    let mergeScope = item
      ? getLoopScope({
          scope,
          index,
          item,
          loopArgs
        })
      : scope

    if (pageContext?.conditions?.[id] === false || !parseCondition(condition, mergeScope, pageContext?.context)) {
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
      getBindProps(schema, mergeScope, pageContext?.context, pageContext),
      getChildren(schema, mergeScope, pageContext, parent, renderComponent, ancestors)
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
    parent: Object,
    pageContext: Object
  },
  setup(props) {
    provide('schema', props.schema)
    const currentPageContext = props.pageContext || inject('pageContext')
    const ancestors = inject('page-ancestors') as Ref<any[]>
    return {
      currentPageContext,
      ancestors
    }
  },
  render() {
    const { scope, schema, parent, ancestors } = this
    const pageContext = this.currentPageContext

    return renderComponent(schema, scope, pageContext, parent, ancestors)
  }
})
export { getController } from './canvas-function'
export default renderer
