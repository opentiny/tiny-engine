<template>
  <div ref="resizeDom" class="canvas-size-controller" :style="sizeStyle">
    <slot></slot>
    <div ref="resize" class="canvas-resize-handle" @mousedown.stop="onMouseDown">
      <div class="handle right-handle">
        <div class="gutter-handle"></div>
        <div class="tab-handle"></div>
      </div>
    </div>
  </div>
</template>
<script>
import { ref, computed, watch, nextTick } from 'vue'
import { useLayout } from '@opentiny/tiny-engine-controller'
import { canvasState } from './container'

export default {
  setup() {
    const sizeStyle = computed(() => {
      const { width, height, maxWidth, minWidth } = useLayout().getDimension()
      return {
        width,
        height,
        maxWidth,
        minWidth
      }
    })

    const mouseDown = ref(false)
    const resizeDom = ref(null)

    const calculateSize = ({ movementX }) => {
      const dimension = useLayout().getDimension()
      const { maxWidth, minWidth, width } = dimension
      const newWidth = parseInt(width) + movementX * 2

      // 鼠标往返移动到边界时再触发反向宽度调整
      useLayout().setDimension({
        width: `${parseInt(Math.min(Math.max(newWidth, parseInt(minWidth)), parseInt(maxWidth)), 10)}px`
      })
    }

    const onMouseMove = (event) => {
      if (mouseDown.value) {
        event.preventDefault()
        calculateSize(event)
      }
    }

    const onMouseUp = () => {
      const iframe = canvasState.iframe

      if (iframe) {
        iframe.style['pointer-events'] = 'auto'
        mouseDown.value = false

        document.removeEventListener('mousemove', onMouseMove, { passive: false })
        document.removeEventListener('mouseup', onMouseUp)
      }
    }

    const bindEvents = () => {
      document.addEventListener('mousemove', onMouseMove, { passive: false })
      document.addEventListener('mouseup', onMouseUp)
    }

    const onMouseDown = () => {
      const iframe = canvasState.iframe

      if (iframe) {
        iframe.style['pointer-events'] = 'none'
        bindEvents()
        mouseDown.value = true
      }
    }

    const setScale = () => {
      useLayout().setDimension({ scale: 1 })
      nextTick(() => {
        const canvasWrap = document.querySelector('#canvas-wrap')

        if (!canvasWrap) {
          return
        }

        const rate = canvasWrap.offsetWidth / resizeDom.value.offsetWidth
        useLayout().setDimension({
          scale: Math.min(rate, 1)
        })
      })
    }

    watch(() => useLayout().getDimension().width, setScale, { flush: 'post', immediate: true })

    watch(() => useLayout().getPluginState().fixedPanels, setScale, { flush: 'post' })

    watch(
      () => useLayout().getPluginState().render,
      (value) => {
        const currentFixed = useLayout().getPluginState().fixedPanels.includes(value)

        if (!value || currentFixed) {
          setScale()
        }
      },
      { flush: 'post' }
    )

    return {
      onMouseDown,
      onMouseMove,
      sizeStyle,
      resizeDom
    }
  }
}
</script>
<style lang="less" scoped>
.canvas-size-controller {
  height: 100%;

  .canvas-resize-handle {
    position: relative;

    .handle {
      position: absolute;
      top: 0;
      bottom: 0;
      z-index: 13;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -3px;
        width: 4px;
        height: 100%;
        background: var(--ti-lowcode-canvas-tab-handle-hover-bg);
        display: none;
      }

      &:hover::before {
        display: block;
      }

      &:hover {
        .tab-handle {
          background: var(--ti-lowcode-canvas-tab-handle-hover-bg);
        }

        .tab-handle:before,
        .tab-handle:after {
          background: #ffffff;
        }
      }

      .gutter-handle {
        position: absolute;
        top: 0;
        left: -3px;
        width: 4px;
        height: 100%;
        cursor: col-resize;
        pointer-events: all;
      }

      .tab-handle {
        position: fixed;
        top: 50%;
        width: 14px;
        height: 38px;
        margin-top: -19px;
        background: var(--ti-lowcode-canvas-iframe-scrollbar-thumb-color);
        cursor: col-resize;
        pointer-events: all;
        border-top-right-radius: 3px;
        border-bottom-right-radius: 3px;

        &::before,
        &::after {
          content: '';
          position: absolute;
          top: 8px;
          bottom: 8px;
          left: 8px;
          width: 1px;
          background: var(--ti-lowcode-canvas-tab-handle-color);
        }

        &::before {
          left: 5px;
        }
      }
    }

    .right-handle {
      right: -14px;
      width: 14px;
    }
  }
}
</style>
