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

import { defineComponent, h, inject, provide } from 'vue'

import { NODE_UID as DESIGN_UIDKEY, NODE_TAG as DESIGN_TAGKEY, NODE_LOOP as DESIGN_LOOPID } from '../../common'
import { getDesignMode, DESIGN_MODE } from './canvas-function'
import { parseCondition, parseData, parseLoopArgs } from './data-function'
import { blockSlotDataMap, getComponent, generateCollection, Mapper, configure } from './material-function'
import { getPage } from './material-function/page-getter'

export const renderDefault = (children, scope, parent) =>
  children.map?.((child) =>
    // eslint-disable-next-line no-use-before-define
    h(renderer, {
      schema: child,
      scope,
      parent
    })
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

const renderSlot = (children, scope, schema, isCustomElm?) => {
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

const getBindProps = (schema, scope, context, pageContext) => {
  const { id, componentName } = schema
  const invalidity = configure[componentName]?.invalidity || []

  if (componentName === 'CanvasPlaceholder') {
    return {}
  }
  const { active, getCssScopeId } = pageContext
  const cssScopeId = getCssScopeId()
  const bindProps = {
    ...parseData(schema.props, scope, context),
    ...(cssScopeId ? { [cssScopeId]: '' } : {}),
    ...(active ? { [DESIGN_UIDKEY]: id } : {}),
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

  if (Mapper[componentName]) {
    bindProps.schema = schema
  }

  // 绑定组件属性时需要将 className 重命名为 class，防止覆盖组件内置 class
  bindProps.class = bindProps.className
  delete bindProps.className

  // 使画布中元素可拖拽
  if (active) {
    bindProps.draggable = true
  }

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

const renderGroup = (children, scope, parent, pageContext) => {
  return children.map?.((schema) => {
    const { componentName, children, loop, loopArgs, condition, id } = schema
    const loopList = parseData(loop, scope, pageContext.context)

    const renderElement = (item?, index?) => {
      const mergeScope = getLoopScope({
        scope,
        index,
        item,
        loopArgs
      })

      pageContext.setNode(schema, parent)

      if (pageContext.conditions[id] === false || !parseCondition(condition, mergeScope, pageContext.context)) {
        return null
      }

      const renderChildren = pageContext.active ? injectPlaceHolder(componentName, children) : children

      return h(
        getComponent(componentName),
        getBindProps(schema, mergeScope, pageContext.context, pageContext),
        Array.isArray(renderChildren)
          ? renderSlot(renderChildren, mergeScope, schema)
          : parseData(renderChildren, mergeScope, pageContext.context)
      )
    }

    return loopList?.length ? loopList.map(renderElement) : renderElement()
  })
}

const getChildren = (schema, mergeScope, pageContext) => {
  const { componentName, children } = schema
  const renderChildren = pageContext.active ? injectPlaceHolder(componentName, children) : children

  const component = getComponent(componentName)
  const isNative = typeof component === 'string'
  const isCustomElm = customElements[componentName]
  const isGroup = checkGroup(componentName)

  if (Array.isArray(renderChildren)) {
    if (isNative || isCustomElm) {
      return renderDefault(renderChildren, mergeScope, schema)
    } else {
      return isGroup
        ? renderGroup(renderChildren, mergeScope, schema, pageContext)
        : renderSlot(renderChildren, mergeScope, schema, isCustomElm)
    }
  } else {
    return parseData(renderChildren, mergeScope, pageContext.context)
  }
}
function getRenderPageId(currentPageId, isPageStart) {
  const pagePathFromRoot = (inject('page-ancestors') as Ref<any[]>).value

  function getNextChild(currentPageId) {
    const index = pagePathFromRoot.indexOf(currentPageId)
    if (index > -1 && index + 1 < pagePathFromRoot.length) {
      return pagePathFromRoot[index + 1]
    }
    return null
  }
  return isPageStart ? pagePathFromRoot[0] : getNextChild(currentPageId)
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
    return {
      currentPageContext
    }
  },
  render() {
    const { scope, schema, parent } = this
    const { componentName, loop, loopArgs, condition } = schema
    const pageContext = this.currentPageContext
    const ancestors = inject('page-ancestors') as Ref<any[]>

    // 处理数据源和表格fetchData的映射关系
    generateCollection(schema)

    if (!componentName) {
      return parseData(schema, scope, pageContext.context)
    }

    const isPageStart = schema.componentType === 'PageStart'
    const isRouterView = componentName === 'RouterView'
    if (ancestors.value.length && (isPageStart || isRouterView)) {
      const renderPageId = getRenderPageId(pageContext.pageId, isPageStart)
      if (renderPageId) {
        return h(getPage(renderPageId), {
          key: ancestors.value,
          [DESIGN_TAGKEY]: `${componentName}`
        })
      }
    }

    const component = getComponent(componentName)

    const loopList = parseData(loop, scope, pageContext.context)

    const renderElement = (item?, index?) => {
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
      pageContext.setNode(schema, parent)

      if (pageContext.conditions[schema.id] === false || !parseCondition(condition, mergeScope, pageContext.context)) {
        return null
      }

      return h(
        component,
        getBindProps(schema, mergeScope, pageContext.context, pageContext),
        getChildren(schema, mergeScope, pageContext)
      )
    }

    return loopList?.length ? loopList.map(renderElement) : renderElement()
  }
})
export { getController } from './canvas-function'
export default renderer
