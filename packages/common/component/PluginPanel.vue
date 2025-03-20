<template>
  <div class="plugin-panel" ref="panel" :style="{ width: panelWidth + 'px' }">
    <div :class="['plugin-panel-header', headerBottomLine]">
      <div class="plugin-panel-title">
        <span class="title"
          >{{ title }}<link-button class="link" v-if="isShowDocsIcon" :href="docsUrl"></link-button
        ></span>
        <close-icon v-if="isCloseLeft" :name="name" @close="closePanel"></close-icon>
      </div>
      <div class="plugin-panel-icon">
        <slot name="header"></slot>
        <tiny-tooltip
          v-if="isShowCollapseIcon"
          effect="light"
          :content="isCollapsed ? '展开' : '折叠'"
          placement="top"
          :visible-arrow="false"
        >
          <template #default>
            <svg-button :name="settingIcon" @click="clickCollapseIcon"></svg-button>
          </template>
        </tiny-tooltip>
        <svg-button
          class="item icon-sidebar"
          :name="fixedPanels?.includes(fixedName) ? 'fixed-solid' : 'fixed'"
          :tips="!fixedPanels?.includes(fixedName) ? '固定面板' : '解除固定面板'"
          @click="fixPanel"
        ></svg-button>
        <close-icon v-if="!isCloseLeft" :name="name" @close="closePanel"></close-icon>
      </div>
    </div>
    <div class="scroll-content">
      <slot name="content"></slot>
    </div>

    <div v-if="isWidthResizable">
      <div class="resizer-right" v-if="isLeftResizer" @mousedown="onMouseDownRight"></div>
      <div class="resizer-left" v-if="isRightResizer" @mousedown="onMouseDownLeft"></div>
    </div>
  </div>
</template>

<script lang="ts">
import { useThrottleFn } from '@vueuse/core'
import { inject, ref, computed, onMounted, provide } from 'vue'
import { useLayout } from '@opentiny/tiny-engine-meta-register'
import { SvgButton } from '@opentiny/tiny-engine-common'
import { constants } from '@opentiny/tiny-engine-utils'
import LinkButton from './LinkButton.vue'
import CloseIcon from './CloseIcon.vue'
import { Tooltip } from '@opentiny/vue'

export default {
  components: {
    TinyTooltip: Tooltip,
    LinkButton,
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
    docsUrl: {
      type: String,
      default: ''
    },
    isShowDocsIcon: {
      type: Boolean,
      default: false
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
    },
    /**
     * 是否展示标题下边线
     */
    showBottomBorder: {
      type: Boolean,
      default: false
    },
    /**
     * 是否展示折叠按钮
     */
    isShowCollapseIcon: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'updateCollapseStatus'],
  setup(props, { emit }) {
    const closePanel = () => {
      emit('close')
    }

    const { PLUGIN_DEFAULT_WIDTH } = constants

    const MIN_WIDTH = PLUGIN_DEFAULT_WIDTH // 固定的最小宽度值
    const MAX_WIDTH = 1000 // 固定的最大宽度值
    const panel = ref(null)
    let startX = 0
    let startWidth = 0

    const isCollapsed = ref(false)
    const settingIcon = computed(() => (isCollapsed.value ? 'collapse_all' : 'expand_all'))

    provide('isCollapsed', isCollapsed)

    const panelState = inject('panelState')
    const fixPanel = () => {
      panelState.emitEvent('fixPanel', props.fixedName)
    }

    const headerBottomLine = computed(() => (props.showBottomBorder ? 'header-bottom-line' : ''))

    const { getPluginWidth, changePluginWidth, getPluginByLayout, changeMoveDragBarState, isPanelWidthResizable } =
      useLayout()

    const align = ref(getPluginByLayout(props.fixedName)) // 滚动条位置
    const panelWidth = ref(getPluginWidth(props.fixedName)) // 面板使用默认宽度
    const isLeftResizer = ref(align.value.includes('left'))
    const isRightResizer = ref(align.value.includes('right'))
    const isWidthResizable = computed(() => isPanelWidthResizable(props.fixedName))

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

    const throttledMouseMoveRight = useThrottleFn(onMouseMoveRight, 50)
    const throttledMouseMoveLeft = useThrottleFn(onMouseMoveLeft, 50)

    const leftResizer = ref(null)
    const rightResizer = ref(null)

    const onMouseUpRight = () => {
      changeMoveDragBarState(false)
      document.removeEventListener('mousemove', throttledMouseMoveRight)
      document.removeEventListener('mouseup', onMouseUpRight)
      rightResizer.value.style.cursor = ''
      rightResizer.value.classList.remove('dragging')
    }

    const onMouseDownRight = (event) => {
      changeMoveDragBarState(true)
      startX = event.clientX
      startWidth = panel.value.offsetWidth
      document.addEventListener('mousemove', throttledMouseMoveRight)
      document.addEventListener('mouseup', onMouseUpRight)
      rightResizer.value.style.cursor = 'ew-resize'
      rightResizer.value.classList.add('dragging')
    }

    const onMouseUpLeft = () => {
      changeMoveDragBarState(false)
      document.removeEventListener('mousemove', throttledMouseMoveLeft)
      document.removeEventListener('mouseup', onMouseUpLeft)
      leftResizer.value.style.cursor = ''
      leftResizer.value.classList.remove('dragging')
    }

    const onMouseDownLeft = (event) => {
      changeMoveDragBarState(true)
      startX = event.clientX
      startWidth = panel.value.offsetWidth
      document.addEventListener('mousemove', throttledMouseMoveLeft)
      document.addEventListener('mouseup', onMouseUpLeft)
      leftResizer.value.style.cursor = 'ew-resize'
      leftResizer.value.classList.add('dragging')
    }

    const initResizerDOM = () => {
      leftResizer.value = document.querySelector('.resizer-left')
      rightResizer.value = document.querySelector('.resizer-right')
    }

    const clickCollapseIcon = () => {
      isCollapsed.value = !isCollapsed.value
      emit('updateCollapseStatus', isCollapsed.value)
    }

    onMounted(() => {
      initResizerDOM()
    })

    return {
      isWidthResizable,
      headerBottomLine,
      clickCollapseIcon,
      isCollapsed,
      settingIcon,
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
  width: 100%;
  height: 100%;
  background: var(--te-component-common-bg-color);
  display: flex;
  flex-direction: column;
  position: relative;

  .plugin-panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans',
      'Helvetica Neue', sans-serif;
    padding: 12px;
    color: var(--te-component-common-text-color-primary);
    font-weight: var(--te-base-font-weight-7);

    .plugin-panel-title {
      display: flex;
      align-items: center;

      .title + .icon-wrap {
        margin-left: 10px;
      }

      .title {
        display: flex;
        align-items: center;
        margin-right: 5px;
      }
    }

    .plugin-panel-icon {
      display: grid;
      grid-auto-flow: column;
      align-items: center;

      :deep(.svg-button + .svg-button) {
        margin-left: 4px;
      }

      :deep(.svg-button + .icon-wrap) {
        margin-left: 4px;
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

.header-bottom-line {
  border-bottom: 1px solid var(--te-common-border-divider);
}

.dragging {
  width: 2px !important;
  background-color: var(--te-component-common-resizer-border-color) !important;
}

.resizer-right:hover {
  width: 2px;
  background-color: var(--te-component-common-resizer-border-color);
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
  width: 2px;
  background-color: var(--te-component-common-resizer-border-color);
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
