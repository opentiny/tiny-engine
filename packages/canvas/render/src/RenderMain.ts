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

import { provide, watch, defineComponent, PropType, ref, inject, onUnmounted } from 'vue'

import { useBroadcastChannel } from '@vueuse/core'
import { constants } from '@opentiny/tiny-engine-utils'

import { getDesignMode, setDesignMode, setController, useCustomRenderer, getController } from './canvas-function'
import { setConfigure } from './material-function'
import { useUtils, useBridge, useDataSourceMap, useGlobalState } from './application-function'
import { IPageSchema, useContext, usePageContext, useSchema } from './page-block-function'
import { api, setCurrentApi } from './canvas-function/canvas-api'
import { getPageAncestors } from './material-function/page-getter'
import CanvasEmpty from './canvas-function/CanvasEmpty.vue'
import { h } from 'vue'
import { setCurrentPage } from './canvas-function/page-switcher'

const { BROADCAST_CHANNEL } = constants

// global-context singleton
const { context: globalContext, setContext: setGlobalContext } = useContext()
const { refreshKey, utils, getUtils, setUtils, updateUtils, deleteUtils } = useUtils(globalContext)
const { bridge, setBridge, getBridge } = useBridge()
const { getDataSourceMap, setDataSourceMap } = useDataSourceMap()
const { getGlobalState, setGlobalState, stores } = useGlobalState()
const updateGlobalContext = () => {
  const context = {
    utils,
    bridge,
    stores
  }
  Object.defineProperty(context, 'dataSourceMap', {
    // TODO: 理论上无法枚举, 先保留写法
    get: getDataSourceMap,
    enumerable: true
  })
  setGlobalContext(context, true)
}
updateGlobalContext()
const activePageContext = usePageContext()

const {
  schema: activeSchema,
  getSchema,
  setSchema,
  getState,
  setState,
  deleteState,
  getProps,
  setProps,
  getMethods,
  setMethods,
  setPagecss
} = useSchema(activePageContext, {
  utils,
  bridge,
  stores,
  getDataSourceMap
})
const { getRenderer, setRenderer } = useCustomRenderer()
const getNode = (id, parent) => (id ? activePageContext.getNode(id, parent) : activeSchema)
const { getContext, getRoot, setNode, setCondition, getCondition, getConditions } = activePageContext
setCurrentApi({
  getUtils,
  setUtils,
  updateUtils,
  deleteUtils,
  getBridge,
  setBridge,
  getMethods,
  setMethods,
  setController,
  setConfigure,
  getSchema,
  setSchema,
  getState,
  deleteState,
  setState,
  getProps,
  setProps,
  getContext,
  getNode,
  getRoot,
  setPagecss,
  setCondition,
  getCondition,
  getConditions,
  getGlobalState,
  getDataSourceMap,
  setDataSourceMap,
  setGlobalState,
  setNode,
  getRenderer,
  setRenderer,
  getDesignMode,
  setDesignMode
})

export default defineComponent({
  props: {
    entry: {
      // 页面入口
      type: Boolean,
      require: false,
      default: true
    },
    cssScopeId: {
      type: String,
      require: false,
      default: null
    },
    parentContext: {
      type: Object,
      require: false,
      default: null
    },
    renderSchema: {
      type: Object as PropType<IPageSchema>,
      require: false,
      default: null
    },
    active: {
      type: Boolean,
      default: false
    },
    pageId: String
  },
  setup(props) {
    const pageAncestors = (inject('page-ancestors') as Ref<any[]>) || ref(null)
    const pageIdFromPath = getController().getBaseInfo().pageId
    const pageContext = props.active || !pageIdFromPath ? activePageContext : usePageContext()
    provide('pageContext', pageContext)

    pageContext.setContextParent(props.parentContext)
    pageContext.pageId = props.pageId || pageIdFromPath
    pageContext.active = props.active || pageIdFromPath === pageContext.pageId
    pageContext.setCssScopeId(props.cssScopeId || (props.entry ? null : `data-te-page-${pageContext.pageId}`))
    if (props.entry) {
      provide('page-ancestors', pageAncestors)
      getPageAncestors(pageContext.pageId).then((value) => {
        pageAncestors.value = value
      })
      const cancel = getController().addHistoryDataChangedCallback(() => {
        const pageIdFromPath = getController().getBaseInfo().pageId
        pageContext.pageId = props.pageId || pageIdFromPath
        pageContext.active = props.active || pageIdFromPath === pageContext.pageId
        getPageAncestors(pageContext.pageId).then((value) => {
          pageAncestors.value = value
        })
      })
      onUnmounted(() => {
        cancel()
      })
    }

    let schema = activeSchema
    let setCurrentSchema
    if (pageContext.pageId && !props.active) {
      const { schema: inActiveSchema, setSchema: setInactiveSchema } = useSchema(pageContext, {
        utils,
        bridge,
        stores,
        getDataSourceMap
      })
      schema = inActiveSchema
      setCurrentSchema = setInactiveSchema
    }

    provide('rootSchema', schema)

    const { post } = useBroadcastChannel({ name: BROADCAST_CHANNEL.SchemaLength })
    watch(
      () => schema?.children?.length,
      (length) => {
        post(length)
      }
    )

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
      [() => props.active, () => props.renderSchema],
      ([active, renderSchema]) => {
        if (active) {
          setCurrentPage({
            pageId: pageContext.pageId,
            schema: schema,
            pageContext: pageContext
          })
        }
        if (!active && !props.entry) {
          setCurrentSchema(renderSchema)
        }
      },
      {
        immediate: true
      }
    )
    const renderer = getRenderer()
    return () =>
      pageAncestors.value === null
        ? h(CanvasEmpty, { placeholderText: '页面分析加载中' })
        : renderer(schema, refreshKey, props.entry, props.active, !!pageContext.pageId)
  }
})

export { api }
