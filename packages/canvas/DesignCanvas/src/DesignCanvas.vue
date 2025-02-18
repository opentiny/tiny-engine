<template>
  <component :is="CanvasLayout">
    <template #header>
      <component v-if="!isBlock()" :is="CanvasRouteBar"></component>
    </template>
    <template #container>
      <component
        :is="CanvasContainer.entry"
        :controller="controller"
        :materials-panel="materialsPanel"
        :canvas-src="canvasSrc"
        :canvas-src-doc="canvasSrcDoc"
        @remove="removeNode"
        @selected="nodeSelected"
      >
      </component>
    </template>
    <template #footer>
      <component :is="CanvasBreadcrumb" :data="footData"></component>
    </template>
  </component>
</template>

<script>
import { ref, watch, onUnmounted, onMounted } from 'vue'
import {
  useProperties,
  useCanvas,
  useLayout,
  useMaterial,
  useHistory,
  useModal,
  usePage,
  useMessage,
  getMergeRegistry,
  getMergeMeta,
  getOptions,
  getMetaApi,
  META_SERVICE,
  META_APP,
  useNotify
} from '@opentiny/tiny-engine-meta-register'
import { constants } from '@opentiny/tiny-engine-utils'
import * as ast from '@opentiny/tiny-engine-common/js/ast'
import { initCanvas } from '../../init-canvas/init-canvas'
import { getImportMapData } from './importMap'
import meta from '../meta'

const { PAGE_STATUS } = constants

const componentType = {
  Block: '区块',
  Page: '页面'
}

export default {
  setup() {
    const registry = getMergeRegistry('canvas')
    const materialsPanel = getMergeMeta('engine.plugins.materials')?.entry
    const { CanvasRouteBar, CanvasBreadcrumb } = registry.components
    const CanvasLayout = registry.layout.entry
    const [CanvasContainer] = registry.metas
    const footData = ref([])
    const showMask = ref(true)
    const canvasRef = ref(null)
    let showModal = false // 弹窗标识
    const { canvasSrc = '' } = getOptions(meta.id) || {}
    const canvasSrcDoc = ref('')

    useMessage().subscribe({
      topic: 'init_canvas_deps',
      subscriber: 'canvas_design_canvas',
      callback: (deps) => {
        if (canvasSrc) {
          return
        }

        const { importMap, importStyles } = getImportMapData(getMergeMeta('engine.config')?.importMapVersion, deps)

        canvasSrcDoc.value = initCanvas(importMap, importStyles).html
      }
    })

    const removeNode = (node) => {
      const { pageState } = useCanvas()
      footData.value = useCanvas().getNodePath(node?.id)
      pageState.currentSchema = {}
      pageState.properties = null
    }

    const isBlock = useCanvas().isBlock

    watch(
      [() => useCanvas().isSaved(), () => useLayout().layoutState.pageStatus, () => useCanvas().getPageSchema()],
      ([isSaved, pageStatus, pageSchema], [oldIsSaved, _oldPageStatus, oldPageSchema]) => {
        if (
          [PAGE_STATUS.Guest, PAGE_STATUS.Occupy].includes(useLayout().layoutState.pageStatus.state) ||
          !pageSchema?.componentName
        ) {
          return
        }

        const pageInfo = pageStatus?.data
        const message = {
          empty: () => '应用下暂无页面，需新建页面后体验画布功能',
          release: (type) => `当前${componentType[type]}未锁定，点击右上角 “锁定” 图标后编辑${componentType[type]}`,
          lock: (type) =>
            `当前${componentType[type]}被 ${pageInfo?.username} ${pageInfo?.resetPasswordToken} 锁定，如需编辑请先联系他解锁文件，然后再锁定该${componentType[type]}后编辑！`
        }

        const renderMsg = message[pageStatus.state](pageSchema.componentName)
        // 两种情况进行提示，
        // 1. 页面或区块状态是未保存状态（尝试编辑）
        // 2. 页面刷新或第一次进入页面(含从别的页面或区块切换到别的页面或区块)
        // 3. 页面上已经有弹窗，不允许重复弹窗
        // 4. 当前历史堆栈为0，且当前未保存状态和上一次未保存状态不一致，不重复弹窗

        const showConfirm = !isSaved || pageSchema !== oldPageSchema

        if (!showConfirm || showModal || (useHistory().historyState?.index === 0 && isSaved !== oldIsSaved)) {
          return
        }

        // 状态重置
        const resetState = () => {
          useHistory().go(-1, false)
          useCanvas().setSaved(true)
          removeNode()
        }

        // callback 是撤销上一步的操作
        // 只有当从已保存状态变成未保存状态的时候，即尝试编辑的时候，才撤销上一步的操作
        const callback = () => {
          showModal = false
          if (!isSaved && oldIsSaved) {
            resetState()
          }
        }

        showModal = true
        useModal().confirm({
          title: '提示',
          message: renderMsg,
          exec: callback,
          cancel: callback,
          hide: () => {
            showModal = false
          }
        })
      }
    )

    const nodeSelected = (node, parent, type, id) => {
      const { toolbars } = useLayout().layoutState
      if (type !== 'clickTree') {
        useLayout().closePlugin()
      }

      const { getSchema, getNodePath } = useCanvas()
      const schemaItem = useCanvas().getNodeById(id)

      const pageSchema = getSchema()

      // 如果选中的节点是画布，就设置成默认选中最外层schema
      useProperties().getProps(schemaItem || pageSchema, parent)
      useCanvas().setCurrentSchema(schemaItem || pageSchema)
      footData.value = getNodePath(schemaItem?.id)
      toolbars.visiblePopover = false
    }

    let canvasResizeObserver = null
    watch(
      () => [useCanvas().isCanvasApiReady.value, canvasRef.value],
      ([ready]) => {
        if (!ready || !canvasRef.value) {
          return
        }

        // 先取消监听，再增加监听事件，避免重复监听
        document.removeEventListener('canvasResize', useCanvas().canvasApi.value.updateRect)
        canvasResizeObserver?.disconnect?.()

        document.addEventListener('canvasResize', useCanvas().canvasApi.value.updateRect)
        canvasResizeObserver = new ResizeObserver(useCanvas().canvasApi.value.updateRect).observe(canvasRef.value)
      }
    )

    onUnmounted(() => {
      document.removeEventListener('canvasResize', useCanvas().canvasApi.value.updateRect)
      canvasResizeObserver?.disconnect?.()
    })

    const { addToCallbackFns: addHistoryDataChangedCallback } = (function () {
      const callbackFns = new Set()

      const { subscribe, unsubscribe } = useMessage()
      let sub

      onMounted(() => {
        sub = subscribe({
          topic: 'locationHistoryChanged',
          subscriber: 'canvas_design_canvas_controller',
          callback: (value) => callbackFns.forEach((cb) => cb(value))
        })
      })

      onUnmounted(() => {
        if (sub) {
          unsubscribe(sub)
        }
      })

      function addToCallbackFns(cb) {
        callbackFns.add(cb)
        return () => callbackFns.delete(cb)
      }
      return {
        addToCallbackFns
      }
    })()

    // TODO: 待挪到 getBaseInfo
    const baseInfoKeys = Object.keys(getMetaApi(META_SERVICE.GlobalService).getBaseInfo())
    function replaceKey(key) {
      const existingKey = baseInfoKeys.find((eKey) => eKey.toLowerCase() === key.toLowerCase())
      if (existingKey) {
        return existingKey
      }
      return key
    }
    const postUrlChanged = () => {
      getMetaApi(META_SERVICE.GlobalService).postLocationHistoryChanged(
        Object.fromEntries(
          Array.from(new URLSearchParams(window.location.search)).map(([key, value]) => [replaceKey(key), value])
        )
      )
    }
    onMounted(() => {
      window.addEventListener('popstate', postUrlChanged)
    })
    onUnmounted(() => {
      window.removeEventListener('popstate', postUrlChanged)

      useMessage().unsubscribe({
        topic: 'init_canvas_deps',
        subscriber: 'canvas_design_canvas'
      })
    })

    return {
      removeNode,
      canvasSrc,
      canvasSrcDoc,
      nodeSelected,
      footData,
      materialsPanel,
      showMask,
      controller: {
        // 需要在canvas/render或内置组件里使用的方法
        getMaterial: useMaterial().getMaterial,
        addHistory: useHistory().addHistory,
        request: getMetaApi(META_SERVICE.Http).getHttp(),
        getPageById: getMetaApi(META_APP.AppManage).getPageById,
        getPageAncestors: usePage().getAncestors,
        getBaseInfo: () => getMetaApi(META_SERVICE.GlobalService).getBaseInfo(),
        addHistoryDataChangedCallback,
        updatePreviewId: getMetaApi(META_SERVICE.GlobalService).updatePreviewId,
        ast,
        getBlockByName: useMaterial().getBlockByName,
        useModal,
        useMessage,
        useNotify
      },
      isBlock,
      CanvasLayout,
      canvasRef,
      CanvasContainer,
      CanvasRouteBar,
      CanvasBreadcrumb
    }
  }
}
</script>
