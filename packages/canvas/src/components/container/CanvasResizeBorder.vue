<template>
  <div
    v-if="state.visible"
    :class="['resize-border', `resize-${state.direction}`]"
    @mousedown="handleResizeStart"
  ></div>
</template>

<script>
import { reactive, watch } from 'vue'
import { useLayout } from '@opentiny/tiny-engine-controller'
import { getCurrent, updateRect, selectState, querySelectById } from './container'

export default {
  props: {
    iframe: {
      type: Object,
      default: () => ({})
    }
  },
  setup(props) {
    const state = reactive({
      top: 0,
      left: 0,
      width: 0,
      height: 0,
      visible: false,
      direction: 'vertical',
      startPosition: {
        x: 0,
        y: 0,
        width: 0,
        height: 0
      }
    })

    const isFirstChild = (parent, schema) => {
      return parent.children[0].id === schema.id
    }

    const handleResize = (event, type) => {
      if (!props.iframe) {
        return
      }

      let { clientX, clientY } = event
      const iframeRect = props.iframe.getBoundingClientRect()
      const scale = useLayout().getScale()

      if (type !== 'iframe') {
        clientX = (clientX - iframeRect.left) / scale
        clientY = (clientY - iframeRect.top) / scale
      }

      const { parent, schema } = getCurrent()

      if (!schema.props) {
        schema.props = {}
      }

      if (state.direction === 'horizontal') {
        let dis = state.startPosition.x - clientX

        if (isFirstChild(parent, schema)) {
          dis = -dis
        }

        let newWidth = state.startPosition.width + dis

        const parentDomNode = querySelectById(parent.id)
        const parentWidth = parseInt(window.getComputedStyle(parentDomNode).width, 10)

        // 最大宽度不能大于父组件宽度
        newWidth = Math.min(newWidth, parentWidth)
        // 最小宽度32
        newWidth = Math.max(newWidth, 32)

        schema.props.flexBasis = `${newWidth}px`
        schema.props.widthType = 'fixed'
      }

      if (state.direction === 'vertical') {
        let target = schema.componentName === 'CanvasRow' ? schema : parent
        if (!target.props) {
          target.props = {}
        }
        const dis = clientY - state.startPosition.y
        const minHeight = state.startPosition.height + dis
        target.props.minHeight = `${minHeight}px`
      }

      updateRect()
    }

    const handleResizeOverIframe = (event) => {
      handleResize(event, 'iframe')
    }

    const handleResizeEnd = () => {
      window.removeEventListener('mousemove', handleResize, true)
      window.removeEventListener('mouseup', handleResizeEnd, true)
      if (props.iframe) {
        const iframeWin = props.iframe.contentWindow
        iframeWin.removeEventListener('mousemove', handleResizeOverIframe, true)
        iframeWin.removeEventListener('mouseup', handleResizeEnd, true)
      }
      updateRect()
    }

    const handleResizeStart = () => {
      const { top, left, width, height } = selectState
      const { parent, schema } = getCurrent()

      let startX = left

      if (isFirstChild(parent, schema)) {
        startX += parseInt(width, 10)
      }

      state.startPosition = {
        x: startX,
        y: top + parseInt(height, 10),
        width: parseInt(width, 10),
        height: parseInt(height, 10)
      }

      window.addEventListener('mousemove', handleResize, true)
      window.addEventListener('mouseup', handleResizeEnd, true)

      // 需要同时监听 iframe 和 app 的 mousemove 、mouseup 事件，因为鼠标移动过快可能会造成在 iframe 上面 mousemove 了
      if (props.iframe) {
        const iframeWin = props.iframe.contentWindow
        iframeWin.addEventListener('mousemove', handleResizeOverIframe, true)
        iframeWin.addEventListener('mouseup', handleResizeEnd, true)
      }
    }

    watch(
      () => selectState,
      () => {
        const { top, left, width, height, componentName } = selectState
        const { parent, schema } = getCurrent()

        if (!['CanvasRow', 'CanvasCol'].includes(componentName)) {
          state.visible = false
          return
        }

        state.visible = true

        if (componentName === 'CanvasRow') {
          state.top = `${top - 10 + height}px`
          state.left = `${left}px`
          state.width = `${width}px`
          state.height = '20px'
          state.direction = 'vertical'
          return
        }

        if (componentName === 'CanvasCol') {
          state.direction = parent.children.length > 1 ? 'horizontal' : 'vertical'
          if (state.direction == 'vertical') {
            // 选中的是 col，但是只有一个 col，所以出现的是 Row 的高度调整边框
            state.top = `${top - 10 + height}px`
            state.left = `${left}px`
            state.width = `${width}px`
            state.height = '20px'
          } else {
            const extraWidth = isFirstChild(parent, schema) ? width : 0
            state.top = `${top}px`
            state.left = `${left - 10 + extraWidth}px`
            state.width = '20px'
            state.height = `${height}px`
          }
        }
      },
      { deep: true }
    )

    return {
      state,
      handleResizeStart
    }
  }
}
</script>

<style lang="less" scoped>
.resize-border {
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 3;
  top: v-bind('state.top');
  left: v-bind('state.left');
  width: v-bind('state.width');
  height: v-bind('state.height');
  &::after {
    content: '';
    display: block;
    border: 1px solid var(--ti-lowcode-common-primary-color);
  }
  &.resize-vertical {
    cursor: ns-resize;
    &::after {
      min-width: 50%;
      height: 4px;
    }
  }

  &.resize-horizontal {
    cursor: ew-resize;
    &::after {
      width: 4px;
      height: 100%;
    }
  }
}
</style>
