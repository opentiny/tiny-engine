<template>
  <div id="canvas-wrap" ref="canvasRef">
    <div ref="siteCanvas" class="site-canvas" :style="siteCanvasStyle">
      <canvas-container
        :controller="controller"
        :materials-panel="materialsPanel"
        :canvas-src="canvasUrl"
        @remove="removeNode"
        @selected="nodeSelected"
      ></canvas-container>
    </div>
    <footer-bar :data="footData" @click="selectFooterNode"></footer-bar>
  </div>
</template>

<script>
import { ref, watch, computed, onUnmounted } from 'vue'
import { CanvasContainer, CanvasFooter } from '@opentiny/tiny-engine-canvas'
import {
  useProperties,
  useCanvas,
  useLayout,
  useResource,
  useHistory,
  useModal
} from '@opentiny/tiny-engine-controller'
import materials from '@opentiny/tiny-engine-plugin-materials'
import { useHttp } from '@opentiny/tiny-engine-http'
import { constants } from '@opentiny/tiny-engine-utils'
import { isVsCodeEnv, isDevelopEnv } from '@opentiny/tiny-engine-controller/js/environments'
import * as ast from '@opentiny/tiny-engine-controller/js/ast'

const { PAGE_STATUS } = constants
const tenant = new URLSearchParams(location.search).get('tenant') || ''
const canvasUrl =
  isVsCodeEnv || isDevelopEnv
    ? `canvas.html?tenant=${tenant}`
    : window.location.origin + window.location.pathname + `/canvas?tenant=${tenant}`

const componentType = {
  Block: '区块',
  Page: '页面'
}

export default {
  components: {
    CanvasContainer,
    FooterBar: CanvasFooter
  },
  setup() {
    const footData = ref([])
    const showMask = ref(true)
    const canvasRef = ref(null)
    let showModal = false // 弹窗标识

    const removeNode = (node) => {
      const { pageState } = useCanvas()
      footData.value = useCanvas().canvasApi.value.getNodePath(node?.id)
      pageState.currentSchema = {}
      pageState.properties = null
    }

    const siteCanvasStyle = computed(() => {
      const { scale } = useLayout().getDimension()
      return {
        height: `calc((100% - var(--base-bottom-panel-height, 30px) - 36px) / ${scale})`,
        transform: `scale(${scale})`
      }
    })

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
          status: 'info',
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

    const selectFooterNode = ({ node }) => {
      const { selectNode } = useCanvas().canvasApi.value

      selectNode(node)
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
      canvasUrl,
      nodeSelected,
      selectFooterNode,
      footData,
      materialsPanel: materials.component,
      showMask,
      controller: {
        // 需要在canvas/render或内置组件里使用的方法
        getMaterial: useResource().getMaterial,
        addHistory: useHistory().addHistory,
        registerBlock: useResource().registerBlock,
        request: useHttp(),
        ast
      },
      siteCanvasStyle,
      canvasRef
    }
  }
}
</script>

<style lang="less" scoped>
#canvas-wrap {
  background: var(--ti-lowcode-canvas-wrap-bg);
  flex: 1 1 0;
  border: none;
  display: flex;
  justify-content: center;
  position: relative;

  .site-canvas {
    background: var(--ti-lowcode-breadcrumb-hover-bg);
    position: absolute;
    overflow: hidden;
    margin: 18px 0;
    transform-origin: top;
  }
}
</style>
