<template>
  <div v-for="multiState in multiSelectedStates" :key="multiState.id">
    <canvas-action
      :hoverState="hoverState"
      :inactiveHoverState="inactiveHoverState"
      :selectState="multiStateLength > 1 ? multiState : selectState"
      :lineState="lineState"
      :windowGetClickEventTarget="target"
      :resize="canvasState.type === 'absolute'"
      :multiStateLength="multiStateLength"
      @select-slot="selectSlot"
      @setting="settingModel"
    ></canvas-action>
  </div>
  <canvas-router-jumper :hoverState="hoverState" :inactiveHoverState="inactiveHoverState"></canvas-router-jumper>
  <canvas-viewer-switcher :hoverState="hoverState" :inactiveHoverState="inactiveHoverState"></canvas-viewer-switcher>
  <canvas-divider :selectState="selectState"></canvas-divider>
  <canvas-resize-border :iframe="iframe"></canvas-resize-border>
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
    <component :is="materialsPanel" :shortcut="insertPosition" @close="insertPosition = false"></component>
  </div>
  <!-- 【添加父级容器】快捷选择物料面板 -->
  <div v-if="insertContainer" ref="containerPanel" class="insert-panel">
    <component
      :is="materialsPanel"
      :shortcut="insertContainer"
      groupName="layout"
      @close="insertContainer = false"
    ></component>
  </div>
</template>

<script>
import { onMounted, ref, computed, onUnmounted, watch, watchEffect } from 'vue'
import { iframeMonitoring } from '@opentiny/tiny-engine-common/js/monitor'
import { useTranslate, useCanvas, useMessage, useResource } from '@opentiny/tiny-engine-meta-register'
import { NODE_UID, NODE_LOOP, DESIGN_MODE } from '../../common'
import { registerHotkeyEvent, removeHotkeyEvent, multiSelectedStates } from './keyboard'
import CanvasMenu, { closeMenu, openMenu } from './components/CanvasMenu.vue'
import CanvasAction from './components/CanvasAction.vue'
import CanvasRouterJumper from './components/CanvasRouterJumper.vue'
import CanvasViewerSwitcher from './components/CanvasViewerSwitcher.vue'
import CanvasResize from './components/CanvasResize.vue'
import CanvasDivider from './components/CanvasDivider.vue'
import CanvasResizeBorder from './components/CanvasResizeBorder.vue'
import {
  canvasState,
  onMouseUp,
  dragMove,
  dragState,
  hoverState,
  inactiveHoverState,
  selectState,
  lineState,
  removeNodeById,
  updateRect,
  getElement,
  dragStart,
  selectNode,
  initCanvas,
  clearLineState,
  querySelectById,
  getCurrent,
  canvasApi,
  getMultiState,
  setMultiState,
  handleMultiState
} from './container'

export default {
  components: {
    CanvasAction,
    CanvasResize,
    CanvasMenu,
    CanvasDivider,
    CanvasResizeBorder,
    CanvasRouterJumper,
    CanvasViewerSwitcher
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
    let showSettingModel = ref(false)
    let target = ref(null)
    const srcAttrName = computed(() => (props.canvasSrc ? 'src' : 'srcdoc'))

    const containerPanel = ref(null)
    const insertContainer = ref(false)

    const multiStateLength = computed(() => multiSelectedStates.value.length)

    const setCurrentNode = async (event, doc = null) => {
      const { clientX, clientY } = event
      const element = getElement(event.target)
      closeMenu()
      let node = getCurrent().schema

      if (element) {
        const currentElement = querySelectById(getCurrent().schema?.id)

        if (!currentElement?.contains(element) || event.button === 0) {
          const selectedState = getMultiState(element, doc)
          setMultiState(multiSelectedStates, selectedState)

          const loopId = element.getAttribute(NODE_LOOP)
          if (loopId) {
            node = await selectNode(element.getAttribute(NODE_UID), `loop-id=${loopId}`)
          } else {
            node = await selectNode(element.getAttribute(NODE_UID))
          }
        }

        if (event.button === 0 && element !== element.ownerDocument.body) {
          const { x, y } = element.getBoundingClientRect()

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
            // html元素使用scroll和mouseup事件处理
            if (event.target === doc.documentElement) {
              isScrolling = false
              return
            }

            const element = getElement(event.target)
            if (!element) {
              return
            }

            // 多选组合键触发
            if (element) {
              const selectedState = getMultiState(element, doc)
              if ((event.ctrlKey || event.metaKey) && event.button === 0) {
                handleMultiState(multiSelectedStates, selectedState)
                return
              }
            }

            insertPosition.value = false
            insertContainer.value = false
            setCurrentNode(event, doc)
            target.value = event.target
          })

          useMessage().publish({ topic: 'canvas-mousedown', data: { event } })
        })

        win.addEventListener('scroll', () => {
          isScrolling = true
        })

        win.addEventListener('mouseup', (event) => {
          if (event.target !== doc.documentElement || isScrolling) {
            return
          }

          insertPosition.value = false
          insertContainer.value = false
          setCurrentNode(event)
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

        win.addEventListener('mousemove', (ev) => {
          handleCanvasEvent(() => {
            dragMove(ev, true)
          })
        })

        // 阻止浏览器默认的右键菜单功能
        win.oncontextmenu = (e) => {
          e.preventDefault()
        }

        registerHotkeyEvent(doc)

        win.addEventListener('scroll', updateRect, true)
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

    const selectSlot = (slotName) => {
      hoverState.slot = slotName
    }

    watch(
      () => multiStateLength.value,
      (newVal) => {
        if (newVal > 1) {
          // 清空属性面板
          selectNode(null)
        }
      }
    )

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
      hoverState,
      inactiveHoverState,
      selectState,
      lineState,
      multiSelectedStates,
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
      srcAttrName
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
  width: 480px;
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
