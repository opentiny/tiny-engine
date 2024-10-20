<template>
  <div class="plugin-panel" ref="panel" :style="{ width: panelWidth + 'px' }">
    <div class="plugin-panel-header">
      <div class="plugin-panel-title">
        <span class="title">{{ title }}</span>
        <close-icon v-if="isCloseLeft" :name="name" @close="closePanel"></close-icon>
      </div>
      <div class="plugin-panel-icon">
        <slot name="header"></slot>
        <svg-button
          class="item icon-sidebar"
          :class="[fixedPanels?.includes(fixedName) && 'active']"
          name="fixed"
          :tips="!fixedPanels?.includes(fixedName) ? '固定面板' : '解除固定面板'"
          @click="fixPanel"
        ></svg-button>
        <close-icon v-if="!isCloseLeft" :name="name" @close="closePanel"></close-icon>
      </div>
    </div>
    <div class="scroll-content">
      <slot name="content"></slot>
    </div>

    <div class="resizer-right" v-if="isLeftResizer" @mousedown="onMouseDownRight"></div>
    <div class="resizer-left" v-if="isRightResizer" @mousedown="onMouseDownLeft"></div>
  </div>
</template>

<script>
import { inject, ref } from 'vue'
import { useLayout } from '@opentiny/tiny-engine-controller'
import CloseIcon from './CloseIcon.vue'
import SvgButton from './SvgButton.vue'
export default {
  components: {
    CloseIcon,
    SvgButton
  },
  props: {
    /**
     * plugin面板标题
     */
    title: {
      type: String,
      default: ''
    },
    /**
     * 关闭图标是否在左侧
     */
    isCloseLeft: {
      type: Boolean,
      default: false
    },
    name: {
      type: String,
      default: 'cross'
    },
    /**
     * 固定面板插件数组
     */
    fixedPanels: {
      type: Array
    },
    /**
     * 固定面板标识
     */
    fixedName: {
      type: String
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    const { getPluginWidth, changePluginWidth, getPluginByLayout, changeMoveDragBarState } = useLayout()
    const panelState = inject('panelState')
    const closePanel = () => {
      useLayout().closePlugin()
      emit('close')
    }

    //节流
    function throttle(func, limit) {
      let lastFunc
      let lastRan
      return function (...args) {
        const context = this
        if (!lastRan) {
          func.apply(context, args)
          lastRan = Date.now()
        } else {
          clearTimeout(lastFunc)
          lastFunc = setTimeout(function () {
            if (Date.now() - lastRan >= limit) {
              func.apply(context, args)
              lastRan = Date.now()
            }
          }, limit - (Date.now() - lastRan))
        }
      }
    }

    const fixPanel = () => {
      panelState.emitEvent('fixPanel', props.fixedName)
    }
    const MIN_WIDTH = 300 // 固定的最小宽度值
    const MAX_WIDTH = 1000 // 固定的最大宽度值
    const panel = ref(null)
    const panelWidth = ref(getPluginWidth(props.fixedName)) // 使用默认宽度
    let startX = 0
    let startWidth = 0

    //滚动条位置
    const align = ref(getPluginByLayout(props.fixedName))
    const isLeftResizer = ref(align.value.includes('left'))
    const isRightResizer = ref(align.value.includes('right'))

    const onMouseMoveRight = (event) => {
      const newWidth = startWidth + (event.clientX - startX)
      panelWidth.value = Math.max(MIN_WIDTH, Math.min(newWidth, MAX_WIDTH))
      changePluginWidth(props.fixedName, panelWidth.value)
    }

    const onMouseMoveLeft = (event) => {
      const newWidth = startWidth - (event.clientX - startX)
      panelWidth.value = Math.max(MIN_WIDTH, Math.min(newWidth, MAX_WIDTH))
      changePluginWidth(props.fixedName, panelWidth.value)
    }

    const throttledMouseMoveRight = throttle(onMouseMoveRight, 50)
    const throttledMouseMoveLeft = throttle(onMouseMoveLeft, 50)

    const onMouseUpRight = () => {
      changeMoveDragBarState(false)
      document.removeEventListener('mousemove', throttledMouseMoveRight)
      document.removeEventListener('mouseup', onMouseUpRight)
    }

    const onMouseUpLeft = () => {
      changeMoveDragBarState(false)
      document.removeEventListener('mousemove', throttledMouseMoveLeft)
      document.removeEventListener('mouseup', onMouseUpLeft)
    }

    const onMouseDownRight = (event) => {
      changeMoveDragBarState(true)
      startX = event.clientX
      startWidth = panel.value.offsetWidth
      document.addEventListener('mousemove', throttledMouseMoveRight)
      document.addEventListener('mouseup', onMouseUpRight)
    }

    const onMouseDownLeft = (event) => {
      changeMoveDragBarState(true)
      startX = event.clientX
      startWidth = panel.value.offsetWidth
      document.addEventListener('mousemove', throttledMouseMoveLeft)
      document.addEventListener('mouseup', onMouseUpLeft)
    }

    return {
      closePanel,
      fixPanel,
      panel,
      panelWidth,
      onMouseDownRight,
      onMouseDownLeft,
      isLeftResizer,
      isRightResizer
    }
  }
}
</script>

<style lang="less" scoped>
.plugin-panel {
  height: 100%;
  background: var(--ti-lowcode-plugin-panel-bg, --ti-lowcode-toolbar-bg);
  display: flex;
  flex-direction: column;
  position: relative;

  .plugin-panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    line-height: 48px;
    font-size: 14px;
    font-weight: var(--ti-lowcode-plugin-panel-title-font-weight);
    font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans',
      'Helvetica Neue', sans-serif;
    padding: 0 12px;
    color: var(--ti-lowcode-plugin-panel-title-color);
    font-weight: var(--ti-lowcode-plugin-panel-title-font-weight);
    border-bottom: 1px solid var(--ti-lowcode-plugin-panel-header-border-bottom-color);
    margin-bottom: 16px;
    .plugin-panel-title {
      display: flex;
      align-items: center;
      .title + .icon-wrap {
        margin-left: 10px;
      }
    }

    .plugin-panel-icon {
      display: grid;
      grid-auto-flow: column;
      align-items: center;

      :deep(.svg-button + .svg-button) {
        margin: 0;
      }
    }
  }
}
// 右边拖拽线
.resizer-right {
  position: absolute;
  top: 0;
  right: 0;
  width: 1px;
  height: 100%;
  cursor: ew-resize;
  background-color: rgba(0, 0, 0, 0.1);
  transition: width 0.3s ease;
}
.resizer-right:hover {
  width: 8px;
  background-color: var(--ti-base-color-brand-7);
}
// 左边拖拽线
.resizer-left {
  position: absolute;
  top: 0;
  left: 0;
  width: 1px;
  height: 100%;
  cursor: ew-resize;
  background-color: rgba(0, 0, 0, 0.1);
  transition: width 0.3s ease;
}
.resizer-left:hover {
  width: 8px;
  background-color: var(--ti-base-color-brand-7);
}
.scroll-content {
  height: 100%;
  overflow: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.scroll-content::-webkit-scrollbar {
  display: none;
}
</style>
