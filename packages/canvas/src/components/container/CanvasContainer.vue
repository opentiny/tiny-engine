<template>
  <canvas-action
    :hoverState="hoverState"
    :selectState="selectState"
    :lineState="lineState"
    :windowGetClickEventTarget="target"
    :resize="canvasState.type === 'absolute'"
    @select-slot="selectSlot"
    @setting="settingModel"
  ></canvas-action>
  <canvas-divider :selectState="selectState"></canvas-divider>
  <canvas-resize-border :iframe="iframe"></canvas-resize-border>
  <canvas-resize>
    <iframe
      v-if="!loading"
      id="canvas"
      ref="iframe"
      :src="canvasSrc"
      style="border: none; width: 100%; height: 100%"
    ></iframe>
    <div v-else class="datainit-tip">应用数据初始化中...</div>
  </canvas-resize>
  <canvas-menu @insert="insertComponent"></canvas-menu>
  <!-- 快捷选择物料面板 -->
  <div v-if="insertPosition" ref="insertPanel" class="insert-panel">
    <component :is="materialsPanel" :shortcut="insertPosition" @close="insertPosition = false"></component>
  </div>
</template>

<script>
import { onMounted, ref, computed, onUnmounted } from 'vue'
import { iframeMonitoring } from '@opentiny/tiny-engine-controller/js/monitor'
import { useTranslate, useCanvas, useResource } from '@opentiny/tiny-engine-controller'
import CanvasAction from './CanvasAction.vue'
import CanvasResize from './CanvasResize.vue'
import CanvasMenu, { closeMenu, openMenu } from './CanvasMenu.vue'
import { NODE_UID, NODE_LOOP } from '../common'
import { registerHostkeyEvent, removeHostkeyEvent } from './keyboard'
import CanvasDivider from './CanvasDivider.vue'
import CanvasResizeBorder from './CanvasResizeBorder.vue'
import {
  canvasState,
  onMouseUp,
  dragMove,
  dragState,
  hoverState,
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
  canvasApi
} from './container'

export default {
  components: { CanvasAction, CanvasResize, CanvasMenu, CanvasDivider, CanvasResizeBorder },
  props: {
    controller: Object,
    canvasSrc: String,
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

    const setCurrentNode = async (event) => {
      const { clientX, clientY } = event
      const element = getElement(event.target)
      closeMenu()
      let node = getCurrent().schema

      if (element) {
        const currentElement = querySelectById(getCurrent().schema?.id)

        if (!currentElement?.contains(element) || event.button === 0) {
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

        win.thirdPartyDeps = useResource().resState.thirdPartyDeps
      }
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
          // html元素使用scroll和mouseup事件处理
          if (event.target === doc.documentElement) {
            isScrolling = false
            return
          }

          insertPosition.value = false
          setCurrentNode(event)
          target.value = event.target
        })

        win.addEventListener('scroll', () => {
          isScrolling = true
        })

        win.addEventListener('mouseup', (event) => {
          if (event.target !== doc.documentElement || isScrolling) {
            return
          }

          insertPosition.value = false
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
          dragMove(ev, true)
        })

        // 阻止浏览器默认的右键菜单功能
        win.oncontextmenu = (e) => {
          e.preventDefault()
        }

        registerHostkeyEvent(doc)

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
        target.value = e.target
      })

      window.addEventListener('dragenter', () => {
        // 如果拖拽范围超出了iframe范围，则清空拖拽位置数据
        clearLineState()
      })

      window.addEventListener('message', updateI18n)
    }

    const insertComponent = (position) => {
      insertPosition.value = position
    }

    const selectSlot = (slotName) => {
      hoverState.slot = slotName
    }

    onMounted(() => run(iframe))
    onUnmounted(() => {
      if (iframe.value?.contentDocument) {
        removeHostkeyEvent(iframe.value.contentDocument)
      }
      window.removeEventListener('message', updateI18n, false)
    })

    document.addEventListener('beforeCanvasReady', beforeCanvasReady)
    document.addEventListener('canvasReady', canvasReady)

    return {
      iframe,
      dragState,
      hoverState,
      selectState,
      lineState,
      removeNodeById,
      selectSlot,
      canvasState,
      insertComponent,
      insertPanel,
      settingModel,
      target,
      showSettingModel,
      insertPosition,
      loading
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
