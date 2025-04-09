<template>
  <div v-for="state in selectState" :key="state.id">
    <canvas-action
      :selectState="state"
      :windowGetClickEventTarget="target"
      :resize="canvasState.type === 'absolute'"
      :multiStateLength="multiStateLength"
      @select-slot="selectSlot"
      @setting="settingModel"
    ></canvas-action>
  </div>
  <canvas-hover :hoverState="curHoverState"></canvas-hover>
  <canvas-insert-line :lineState="lineState" :hoverState="curHoverState"></canvas-insert-line>
  <canvas-router-jumper :hoverState="curHoverState"></canvas-router-jumper>
  <canvas-viewer-switcher :hoverState="curHoverState"></canvas-viewer-switcher>
  <canvas-divider :selectState="computedSelectState"></canvas-divider>
  <canvas-resize-border :selectState="computedSelectState" :iframe="iframe"></canvas-resize-border>
  <canvas-resize>
    <template v-if="!loading">
      <iframe
        id="canvas"
        ref="iframe"
        :[srcAttrName]="canvasSrc || canvasSrcDoc"
        style="border: none; width: 100%; height: 100%"
      ></iframe>
    </template>
    <div v-else class="datainit-tip">应用数据初始化中...</div>
  </canvas-resize>
  <canvas-menu @insert="insertComponent"></canvas-menu>
  <!-- 快捷选择物料面板 -->
  <div v-if="insertPosition" ref="insertPanel" class="insert-panel">
    <component
      :is="materialsPanel"
      class="component-wrap"
      :shortcut="insertPosition"
      @close="insertPosition = false"
    ></component>
  </div>
  <!-- 【添加父级容器】快捷选择物料面板 -->
  <div v-if="insertContainer" ref="containerPanel" class="insert-panel">
    <component
      :is="materialsPanel"
      :shortcut="insertContainer"
      class="component-wrap"
      groupName="layout"
      @close="insertContainer = false"
    ></component>
  </div>
</template>

<script>
import { onMounted, ref, computed, onUnmounted, watch, watchEffect } from 'vue'
import { iframeMonitoring } from '@opentiny/tiny-engine-common/js/monitor'
import { useTranslate, useCanvas, useMessage, useResource } from '@opentiny/tiny-engine-meta-register'
import { DESIGN_MODE } from '../../common'
import { registerHotkeyEvent, removeHotkeyEvent } from './keyboard'
import CanvasMenu, { closeMenu, openMenu } from './components/CanvasMenu.vue'
import CanvasAction from './components/CanvasAction.vue'
import CanvasRouterJumper from './components/CanvasRouterJumper.vue'
import CanvasViewerSwitcher from './components/CanvasViewerSwitcher.vue'
import CanvasResize from './components/CanvasResize.vue'
import CanvasDivider from './components/CanvasDivider.vue'
import CanvasResizeBorder from './components/CanvasResizeBorder.vue'
import CanvasHover from './components/CanvasHover.vue'
import CanvasInsertLine from './components/CanvasInsertLine.vue'
import {
  canvasState,
  onMouseUp,
  dragMove,
  dragState,
  lineState,
  removeNodeById,
  syncNodeScroll,
  dragStart,
  initCanvas,
  clearLineState,
  canvasApi
} from './container'
import { useHoverNode, useSelectNode } from './interactions'

export default {
  components: {
    CanvasAction,
    CanvasResize,
    CanvasMenu,
    CanvasDivider,
    CanvasResizeBorder,
    CanvasRouterJumper,
    CanvasViewerSwitcher,
    CanvasHover,
    CanvasInsertLine
  },
  props: {
    controller: Object,
    canvasSrc: String,
    canvasSrcDoc: String,
    materialsPanel: Object
  },
  emits: ['selected', 'remove'],
  setup(props, { emit }) {
    const iframe = ref(null)
    const insertPanel = ref(null)
    const insertPosition = ref(false)
    const loading = computed(() => useCanvas().isLoading())
    const showSettingModel = ref(false)
    const target = ref(null)
    const srcAttrName = computed(() => (props.canvasSrc ? 'src' : 'srcdoc'))
    const containerPanel = ref(null)
    const insertContainer = ref(false)
    const { selectState, updateSelectedNode, defaultSelectState } = useSelectNode()
    const { curHoverState, updateHoverNode } = useHoverNode()
    const multiStateLength = computed(() => selectState.value.length)
    const computedSelectState = computed(() => {
      if (selectState.value.length === 1) {
        return selectState.value[0]
      }

      return defaultSelectState
    })

    const handleNodeInteractions = async (event) => {
      const { clientX, clientY } = event
      closeMenu()
      await updateSelectedNode(event)
      const node = selectState.value.node

      if (node) {
        const element = selectState.value.element
        if (event.button === 0 && element !== element?.ownerDocument?.body) {
          const { left: x, top: y } = selectState.value.rect
          dragStart(node, element, { offsetX: clientX - x, offsetY: clientY - y })
        }

        // 如果是点击右键则打开右键菜单
        if (event.button === 2) {
          openMenu(event)
        }
      }
    }

    useCanvas().initCanvasApi(canvasApi)

    const beforeCanvasReady = () => {
      if (iframe.value) {
        const win = iframe.value.contentWindow
        // 用于画布初始化组件依赖
        win.componentsDeps = useResource().appSchemaState.materialsDeps.scripts.filter((item) => item.components)

        const { subscribe, unsubscribe } = useMessage()
        const { getSchemaDiff, patchLatestSchema, getSchema, getNode } = useCanvas()
        const { appSchemaState } = useResource()

        iframe.value.contentWindow.host = {
          unsubscribe,
          subscribe,
          getSchemaDiff,
          patchLatestSchema,
          watch,
          watchEffect,
          getSchema,
          appSchema: appSchemaState,
          schemaUtils: {
            getSchema,
            getNode
          }
        }
      }
    }

    const handleCanvasEvent = (handler) => {
      const designMode = canvasApi.getDesignMode()

      if (designMode !== DESIGN_MODE.DESIGN) {
        return
      }

      return handler()
    }

    const canvasReady = ({ detail }) => {
      if (iframe.value) {
        // 设置monitor报错埋点
        iframeMonitoring()

        initCanvas({ emit, renderer: detail, iframe: iframe.value, controller: props.controller })

        const doc = iframe.value.contentDocument
        const win = iframe.value.contentWindow

        let isScrolling = false

        // 以下是内部iframe监听的事件
        win.addEventListener('mousedown', (event) => {
          handleCanvasEvent(() => {
            insertPosition.value = false
            insertContainer.value = false
            handleNodeInteractions(event)
            target.value = event.target
          })

          useMessage().publish({ topic: 'canvas-mousedown', data: { event } })
        })
        win.addEventListener('contextmenu', (event) => {
          handleCanvasEvent(() => {
            if (event.target === doc.documentElement) {
              return
            }

            insertPosition.value = false
            insertContainer.value = false
            handleNodeInteractions(event)
            target.value = event.target
          })
        })

        let scrollTimeout = null
        win.addEventListener('scroll', () => {
          isScrolling = true

          clearTimeout(scrollTimeout)

          scrollTimeout = setTimeout(() => {
            isScrolling = false
          }, 100)
        })

        // TODO: 需要确认下该事件还是否需要
        win.addEventListener('mouseup', (event) => {
          if (event.target !== doc.documentElement || isScrolling) {
            return
          }

          insertPosition.value = false
          insertContainer.value = false
          // handleNodeInteractions(event)
          target.value = event.target
        })

        win.addEventListener('dragover', (ev) => {
          ev.dataTransfer.dropEffect = 'move'
          ev.preventDefault()
          dragMove(ev)
        })

        win.addEventListener('drop', (ev) => {
          ev.preventDefault()
          onMouseUp(ev)
        })

        win.addEventListener('mouseover', (ev) => {
          handleCanvasEvent(() => {
            // 更新当前鼠标 hover 的节点
            updateHoverNode(ev)
          })
        })

        // 阻止浏览器默认的右键菜单功能
        win.oncontextmenu = (e) => {
          e.preventDefault()
        }

        registerHotkeyEvent(doc)

        win.addEventListener('scroll', syncNodeScroll, true)
      }
    }
    // 设置弹窗
    const settingModel = () => {
      showSettingModel.value = true
    }

    const updateI18n = (message) => {
      if (message?.data?.isI18n) {
        const data = message.data.data || {}
        const ensureI18n = useTranslate().ensureI18n
        Object.keys(data).forEach((key) => {
          ensureI18n(data[key], false)
        })
      }
    }
    const run = () => {
      // 以下是外部window需要监听的事件
      window.addEventListener('mousedown', (e) => {
        insertPosition.value = insertPanel.value?.contains(e.target)
        insertContainer.value = containerPanel.value?.contains(e.target)
        target.value = e.target
      })

      window.addEventListener('dragenter', () => {
        // 如果拖拽范围超出了iframe范围，则清空拖拽位置数据
        clearLineState()
      })

      window.addEventListener('message', updateI18n)
    }

    const insertComponent = (position) => {
      if (position === 'out') {
        insertContainer.value = position
        return
      }
      insertPosition.value = position
    }

    // TODO: 需要确认下该事件还是否需要
    const selectSlot = (_slotName) => {
      // hoverState.slot = slotName
    }

    onMounted(() => run(iframe))
    onUnmounted(() => {
      if (iframe.value?.contentDocument) {
        removeHotkeyEvent(iframe.value.contentDocument)
      }
      window.removeEventListener('message', updateI18n, false)
    })

    document.addEventListener('beforeCanvasReady', beforeCanvasReady)
    document.addEventListener('canvasReady', canvasReady)

    return {
      iframe,
      dragState,
      // hoverState,
      computedSelectState,
      lineState,
      multiStateLength,
      removeNodeById,
      selectSlot,
      canvasState,
      insertComponent,
      insertPanel,
      containerPanel,
      settingModel,
      target,
      showSettingModel,
      insertPosition,
      insertContainer,
      loading,
      srcAttrName,
      selectState,
      curHoverState
    }
  }
}
</script>
<style lang="less" scoped>
.insert-panel {
  z-index: 4;
  position: fixed;
  top: 200px;
  left: 400px;

  .component-wrap {
    width: 480px !important;
  }

  :deep(.components-wrap) {
    & > .tiny-collapse {
      max-height: 300px;
    }
  }
  :deep(#pane-blocks) {
    max-height: 400px;
  }
}
.datainit-tip {
  display: flex;
  height: 100%;
  justify-content: center;
  align-items: center;
  color: #1890ff;
}
</style>
