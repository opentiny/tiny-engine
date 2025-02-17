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

import { provide, watch, defineComponent, ref, inject, onUnmounted, h, type PropType, type Ref } from 'vue'
import {
  getDesignMode,
  setDesignMode,
  setController,
  useCustomRenderer,
  getController,
  useRouterViewSetting,
  useLocale
} from './canvas-function'
import { removeBlockCompsCache, setConfigure } from './material-function'
import { useUtils, useBridge, useDataSourceMap, useGlobalState } from './application-function'
import { IPageSchema, useContext, usePageContext, useSchema } from './page-block-function'
import { api, setCurrentApi } from './canvas-function/canvas-api'
import { getPageAncestors } from './material-function/page-getter'
import CanvasEmpty from './canvas-function/CanvasEmpty.vue'
import { setCurrentPage } from './canvas-function/page-switcher'
import { useThrottleFn } from '@vueuse/core'
import { useRouterPreview } from './canvas-function/router-preview'

// global-context singleton
const { context: globalContext, setContext: setGlobalContext } = useContext()
const { refreshKey, utils, getUtils, setUtils } = useUtils(globalContext)
const { bridge } = useBridge()
const { getDataSourceMap, setDataSourceMap } = useDataSourceMap()
const { setGlobalState, stores } = useGlobalState()
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
export const activePageContext = usePageContext()

const {
  schema: activeSchema,
  setSchema,
  setPageCss
} = useSchema(activePageContext, {
  utils,
  bridge,
  stores,
  getDataSourceMap
})
const { getRenderer, setRenderer } = useCustomRenderer()
const { setCondition } = activePageContext
const updateCanvas = () => {
  refreshKey.value++
}
setCurrentApi({
  // 用于lowcode.ts获取utils工具
  getUtils,
  getDataSourceMap,
  setController,
  // 设置物料配置
  setConfigure,
  setCondition,
  getRenderer,
  setRenderer,
  getDesignMode,
  setDesignMode,
  removeBlockCompsCache,
  updateCanvas
})

const throttleUpdateSchema = useThrottleFn(
  () => {
    window.host.patchLatestSchema(activeSchema)
  },
  100,
  true
)

const pageRenderer = getRenderer()
const { routerViewSetting } = useRouterViewSetting()

export default defineComponent({
  props: {
    entry: {
      // 页面入口
      type: Boolean,
      default: true
    },
    cssScopeId: {
      type: String,
      default: null
    },
    parentContext: {
      type: Object as PropType<ReturnType<typeof useContext>>,
      default: null
    },
    renderSchema: {
      type: Object as PropType<IPageSchema>,
      default: null
    },
    active: {
      type: Boolean,
      default: false
    },
    pageId: {
      type: String,
      default: null
    }
  },
  setup(props) {
    const pageAncestors = (inject('page-ancestors') as Ref<any[]>) || ref(null)
    const pageIdFromPath = getController().getBaseInfo().pageId
    // 顶层使用activePageContext，区块和页面间切换不受影响(短期方案)，因为页面的pageContext目前非响应式（仅刷新画布执行一次），无法动态切换激活态和非激活态
    const pageContext = props.active || props.entry ? activePageContext : usePageContext()
    provide('pageContext', pageContext)

    pageContext.setContextParent(props.parentContext)
    // 顶层isPage的判断和pageId耦合了，短期先使得顶层和激活页共用pageId，后续需要增加pageContext.isPage
    pageContext.pageId = props.pageId || pageIdFromPath
    pageContext.active = props.active || !pageIdFromPath || props.entry
    pageContext.setCssScopeId(props.cssScopeId || `data-te-page-${pageContext.pageId}`)
    if (props.entry) {
      provide('page-ancestors', pageAncestors)
      provide('page-preview', useRouterPreview().previewPath)
      const updatePageAncestor = () => {
        if (routerViewSetting.viewMode === 'standalone') {
          pageAncestors.value = []
          return
        }
        getPageAncestors(pageContext.pageId).then((value) => {
          pageAncestors.value = value
        })
      }
      updatePageAncestor()

      const cancel = getController().addHistoryDataChangedCallback(() => {
        const pageIdFromPath = getController().getBaseInfo().pageId
        pageContext.pageId = pageIdFromPath
        pageContext.setCssScopeId(`data-te-page-${pageContext.pageId}`)
        updatePageAncestor()
      })
      onUnmounted(() => {
        cancel()
      })

      watch(
        () => routerViewSetting.viewMode,
        () => {
          updatePageAncestor()
        }
      )

      useLocale()

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

      watch(
        () => activeSchema.css,
        (value) => {
          setPageCss(value)
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
    }

    let schema = activeSchema
    let setCurrentSchema
    if (pageContext.pageId && !props.active && !props.entry) {
      // 注意顶层使用activeSchema和对应的api
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

    if (!props.entry) {
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
            setCurrentSchema?.(renderSchema, props.pageId)
          }
        },
        {
          immediate: true
        }
      )
    }

    return () =>
      pageAncestors.value === null
        ? h(CanvasEmpty, { placeholderText: '页面分析加载中' })
        : pageRenderer(
            schema,
            refreshKey,
            props.entry,
            pageContext.active,
            !!pageContext.pageId && pageAncestors.value.length
          )
  }
})

export { api }
