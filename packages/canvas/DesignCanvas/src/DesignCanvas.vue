<template>
  <component :is="CanvasLayout">
    <template #container>
      <component
        :is="CanvasContainer.entry"
        :controller="controller"
        :materials-panel="materialsPanel"
        :canvas-src="canvasSrc"
        :canvas-src-doc="canvasSrcDoc"
        @remove="removeNode"
        @selected="nodeSelected"
      ></component>
    </template>
    <template #footer>
      <component :is="CanvasBreadcrumb" :data="footData"></component>
    </template>
  </component>
</template>

<script>
import { ref, watch, onUnmounted } from 'vue'
import {
  useProperties,
  useCanvas,
  useLayout,
  useMaterial,
  useHistory,
  useModal,
  getMergeRegistry,
  getMergeMeta,
  getOptions,
  getMetaApi,
  META_SERVICE
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
    const { CanvasBreadcrumb } = registry.components
    const CanvasLayout = registry.layout.entry
    const [CanvasContainer] = registry.metas
    const footData = ref([])
    const showMask = ref(true)
    const canvasRef = ref(null)
    let showModal = false // 弹窗标识
    const { canvasSrc = '' } = getOptions(meta.id) || {}
    let canvasSrcDoc = ''

    if (!canvasSrc) {
      const { importMap, importStyles } = getImportMapData(getMergeMeta('engine.config')?.importMapVersion)
      canvasSrcDoc = initCanvas(importMap, importStyles).html
    }

    const removeNode = (node) => {
      const { pageState } = useCanvas()
      footData.value = useCanvas().canvasApi.value.getNodePath(node?.id)
      pageState.currentSchema = {}
      pageState.properties = null
    }

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

        const showConfirm = !isSaved || pageSchema !== oldPageSchema

        if (!showConfirm || showModal) {
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

    const nodeSelected = (node, parent, type) => {
      const { toolbars } = useLayout().layoutState
      if (type !== 'clickTree') {
        useLayout().closePlugin()
      }

      const { getSchema, getNodePath } = useCanvas().canvasApi.value

      const schema = getSchema()
      // 如果选中的节点是画布，就设置成默认选中最外层schema
      useProperties().getProps(node || schema, parent)
      useCanvas().setCurrentSchema(node || schema)
      footData.value = getNodePath(node?.id)
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
        registerBlock: useMaterial().registerBlock,
        request: getMetaApi(META_SERVICE.Http).getHttp(),
        ast
      },
      CanvasLayout,
      canvasRef,
      CanvasContainer,
      CanvasBreadcrumb
    }
  }
}
</script>
