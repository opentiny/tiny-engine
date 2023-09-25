<template>
  <div
    v-show="selectState.height && selectState.width"
    class="canvas-rect select"
    :style="{
      top: selectState.top + 'px',
      left: selectState.left + 'px',
      height: selectState.height + 'px',
      width: selectState.width + 'px'
    }"
  >
    <div v-if="!resize" ref="labelRef" class="corner-mark-left" :style="labelStyle">
      <span>{{ selectState.componentName }}</span>
      <TinyPopover
        v-model="showPopover"
        placement="top-start"
        title="快捷设置"
        width="310"
        popper-class="short-cut-set"
        trigger="manual"
      >
        <shortCutPopover v-if="showPopover" @active="activeSetting('props')"></shortCutPopover>
        <template #reference>
          <icon-setting class="icon-setting" @click.stop="showPopover = !showPopover"></icon-setting>
        </template>
      </TinyPopover>
    </div>
    <!-- 绝对定位画布时调节元素大小 -->
    <template v-else>
      <div class="drag-resize resize-top" @mousedown.stop="onMousedown($event, 'center', 'start')"></div>
      <div class="drag-resize resize-bottom" @mousedown.stop="onMousedown($event, 'center', 'end')"></div>
      <div class="drag-resize resize-left" @mousedown.stop="onMousedown($event, 'start', 'center')"></div>
      <div class="drag-resize resize-right" @mousedown.stop="onMousedown($event, 'end', 'center')"></div>
      <div class="drag-resize resize-top-left" @mousedown.stop="onMousedown($event, 'start', 'start')"></div>
      <div class="drag-resize resize-top-right" @mousedown.stop="onMousedown($event, 'end', 'start')"></div>
      <div class="drag-resize resize-bottom-left" @mousedown.stop="onMousedown($event, 'start', 'end')"></div>
      <div class="drag-resize resize-bottom-right" @mousedown.stop="onMousedown($event, 'end', 'end')"></div>
    </template>
    <div v-if="showAction" class="corner-mark-right" :style="fixStyle">
      <template v-if="!isModal">
        <div v-if="showToParent" title="选择父级">
          <icon-chevron-left @click.stop="selectParent"></icon-chevron-left>
        </div>
        <div title="向上移动">
          <icon-arrow-up @click.stop="moveUp"></icon-arrow-up>
        </div>
        <div title="向下移动">
          <icon-arrow-down @click.stop="moveDown"></icon-arrow-down>
        </div>
        <div title="复制">
          <icon-copy @click.stop="copy"></icon-copy>
        </div>
      </template>
      <template v-else>
        <div title="隐藏">
          <icon-eyeclose @click.stop="hide"></icon-eyeclose>
        </div>
      </template>
      <div title="删除">
        <icon-del @click.stop="remove"></icon-del>
      </div>
    </div>
  </div>
  <div v-show="hoverState.height && hoverState.width" class="canvas-rect hover">
    <div class="corner-mark-left">
      {{ hoverState.componentName }}
    </div>
    <div v-show="hoverState.configure?.isContainer" class="corner-mark-bottom-right">拖放元素到容器内</div>
  </div>
  <div v-show="lineState.height && lineState.width" class="canvas-rect line">
    <div :class="['hover-line', lineState.position]">
      <div v-if="lineState.position === 'in' && hoverState.configure" class="choose-slots"></div>
    </div>
  </div>
</template>
<script>
import { watchPostEffect, ref, watch, computed } from 'vue'
import {
  IconDel,
  IconSetting,
  IconChevronLeft,
  IconArrowDown,
  IconArrowUp,
  IconCopy,
  IconEyeclose
} from '@opentiny/vue-icon'
import {
  getCurrent,
  removeNodeById,
  selectNode,
  updateRect,
  copyNode,
  getRenderer,
  getSchema,
  dragStart,
  getCurrentElement
} from './container'
import { useResource } from '@opentiny/tiny-engine-controller'
import { Popover } from '@opentiny/vue'
import shortCutPopover from './shortCutPopover.vue'

// 工具操作条高度
const OPTION_BAR_HEIGHT = 24
// 标签高度
const LABEL_HEIGHT = 24
// 操作条最大宽度
const MAX_OPTION_WIDTH = 110

// 画布右边滚动条宽度
const SCROLL_BAR_WIDTH = 8

// 当工具操作条和标签高度并排显示时，需要的间距 6px
const OPTION_SPACE = 6

export default {
  components: {
    IconDel: IconDel(),
    IconSetting: IconSetting(),
    IconChevronLeft: IconChevronLeft(),
    IconArrowDown: IconArrowDown(),
    IconArrowUp: IconArrowUp(),
    IconCopy: IconCopy(),
    IconEyeclose: IconEyeclose(),
    shortCutPopover,
    TinyPopover: Popover
  },
  props: {
    hoverState: {
      type: Object,
      default: () => ({})
    },
    selectState: {
      type: Object,
      default: () => ({})
    },
    lineState: {
      type: Object,
      default: () => ({})
    },
    resize: {
      type: Boolean,
      default: false
    },
    windowGetClickEventTarget: Object
  },
  emits: ['remove', 'selectSlot', 'setting'],
  setup(props) {
    const remove = () => {
      removeNodeById(getCurrent().schema?.id)
    }

    const moveChild = (list, selected, addend) => {
      if (!list || list.length < 2) {
        return
      }

      const index = list.indexOf(selected)

      if (index > -1) {
        const toIndex = index + addend

        if (toIndex > -1 && toIndex < list.length) {
          // eslint-disable-next-line no-extra-semi
          ;[list[index], list[toIndex]] = [list[toIndex], list[index]]

          updateRect()
        }
      }
    }

    const moveUp = () => {
      const { parent, schema } = getCurrent()
      moveChild(parent?.children, schema, -1)
    }

    const moveDown = () => {
      const { parent, schema } = getCurrent()
      moveChild(parent?.children, schema, 1)
    }

    const selectParent = () => {
      const parentId = getCurrent().parent?.id
      parentId && selectNode(parentId)
    }

    const copy = () => {
      copyNode(getCurrent().schema.id)
    }

    const hide = () => {
      getRenderer().setCondition(getCurrent().schema?.id, false)
      updateRect()
    }

    const showAction = computed(() => {
      const { parent } = getCurrent()
      return !props.resize && parent && parent?.type !== 'JSSlot'
    })

    const showToParent = computed(() => getCurrent().parent !== getSchema())

    const isModal = computed(() => {
      const config = useResource().getMaterial(props.selectState.componentName)
      return config?.configure?.isModal
    })

    const fixStyle = ref('')

    let showPopover = ref(false)

    const activeSetting = () => {
      showPopover.value = false
    }

    const findParentHasClass = (target) => {
      let parent = target.parentNode
      let flag = false

      if (parent.className === undefined) {
        return false
      }

      let name = JSON.stringify(parent.className)

      if (name && name.indexOf('short-cut-set') === -1 && name.indexOf('tiny-dialog-box') === -1) {
        flag = findParentHasClass(parent)
      } else {
        flag = true
      }

      return flag
    }

    const onMousedown = (event, horizontal, vertical) => {
      const element = getCurrentElement()
      if (!element) {
        return
      }
      const { x, y, height, width } = element.getBoundingClientRect()

      dragStart(getCurrent().schema, element, {
        offsetX: event.clientX,
        offsetY: event.clientY,
        x,
        y,
        height,
        width,
        horizontal,
        vertical
      })
    }

    watch(
      () => props.windowGetClickEventTarget,
      (newProps) => {
        if (newProps) {
          let flag = findParentHasClass(newProps)
          if (!flag) {
            showPopover.value = false
          }
        }
      }
    )

    const labelRef = ref(null)
    const labelStyle = ref('')

    const bottomPanelHeight = ref(0)
    const topToolbarHeight = ref(0)

    watchPostEffect(() => {
      if (!bottomPanelHeight.value) {
        bottomPanelHeight.value = document.querySelector('#tiny-bottom-panel')?.offsetHeight
      }
      if (!topToolbarHeight.value) {
        topToolbarHeight.value = document.querySelector('.tiny-engine-toolbar')?.offsetHeight
      }

      const { left, top, width, height } = props.selectState

      // 是否 将label 标签放置到底部，判断 top 距离
      const isLabelAtBottom = top <= topToolbarHeight.value + LABEL_HEIGHT
      // 是否将操作栏放置到底部，判断当前选中组件底部与页面底部的距离。
      const isOptionAtBottom = window.innerHeight - top - height - bottomPanelHeight.value > OPTION_BAR_HEIGHT

      // 选中组件需要最小的宽度，如果小于这个最小宽度，label 和 option 组件可能会重叠遮挡，labelRef.value.clientWidth：label 的宽度
      const minWidth = MAX_OPTION_WIDTH + labelRef.value?.clientWidth || 0
      let translateXDis = 0

      const siteCanvas = document.querySelector('.site-canvas')
      const right = siteCanvas.getBoundingClientRect().right
      // 判断是否偏右，偏右且重叠的话，需要移动 label 的位移，不能移动 option 的位移，否则有可能被遮挡
      const isOverRight = right <= left + width + SCROLL_BAR_WIDTH

      // 如果选中组件宽度小于最小宽度要求，则需要位移
      if (width < minWidth) {
        translateXDis = MAX_OPTION_WIDTH - width + (labelRef.value?.clientWidth || 0) + OPTION_SPACE
      }

      labelStyle.value = `top: unset; ${isLabelAtBottom ? 'bottom' : 'top'}: -${LABEL_HEIGHT}px; ${
        isOverRight && isLabelAtBottom === isOptionAtBottom && `left: -${translateXDis}px;`
      }`

      fixStyle.value = `
        ${translateXDis && !isOverRight ? `transform: translateX(${translateXDis}px);` : ''}
        ${isOptionAtBottom ? 'bottom' : 'top'}: -${OPTION_BAR_HEIGHT}px;`
    })

    return {
      remove,
      moveUp,
      moveDown,
      copy,
      hide,
      selectParent,
      fixStyle,
      showAction,
      showPopover,
      showToParent,
      activeSetting,
      isModal,
      onMousedown,
      labelStyle,
      labelRef
    }
  }
}
</script>

<style lang="less">
.canvas-rect {
  position: fixed;
  box-sizing: border-box;
  pointer-events: none;
  border: 1px solid var(--ti-lowcode-canvas-rect-border-color);
  z-index: 2;
  &.absolute {
    pointer-events: all;
  }
  &.hover {
    border-style: dashed;
    top: v-bind("hoverState.top + 'px'");
    left: v-bind("hoverState.left + 'px'");
    height: v-bind("hoverState.height + 'px'");
    width: v-bind("hoverState.width + 'px'");

    .corner-mark-left {
      height: 14px;
      top: -14px;
      padding-left: 0;
      font-size: 12px;
    }
  }
  &.line {
    border-color: transparent;
    top: v-bind("lineState.top + 'px'");
    left: v-bind("lineState.left + 'px'");
    height: v-bind("lineState.height + 'px'");
    width: v-bind("lineState.width + 'px'");
  }
  .hover-line {
    &.top {
      width: 100%;
      height: 5px;
      background: var(--ti-lowcode-icon-bind-color);
      position: absolute;
      top: -3px;
    }
    &.left {
      width: 5px;
      height: 100%;
      background: var(--ti-lowcode-icon-bind-color);
      position: absolute;
      left: -3px;
    }
    &.bottom {
      width: 100%;
      height: 5px;
      background: var(--ti-lowcode-icon-bind-color);
      position: absolute;
      bottom: -3px;
    }
    &.right {
      width: 5px;
      height: 100%;
      background: var(--ti-lowcode-icon-bind-color);
      position: absolute;
      right: -3px;
    }
    &.in {
      width: 100%;
      height: 100%;
      background: var(--ti-lowcode-canvas-hover-line-in-bg-color);
    }
    &.forbid {
      width: 100%;
      height: 100%;
      background: var(--ti-lowcode-canvas-hover-line-forbid-bg-color);
    }
  }

  .choose-slots {
    display: flex;
    justify-content: left;
    align-items: left;
    height: 100%;
    & > div {
      pointer-events: all;
      width: 40px;
      border: 1px solid var(--ti-lowcode-canvas-choose-slot-border-color);
      color: var(--ti-lowcode-canvas-choose-slot-color);
      overflow: hidden;
      font-size: 10px;
      margin: 2px;
      text-align: center;
      &:hover {
        background: #40a9ff;
        color: #fff;
      }
    }
  }

  .corner-mark-left {
    display: flex;
    align-items: center;
    font-size: 14px;
    position: absolute;
    top: -24px;
    height: 24px;
    color: var(--ti-lowcode-canvas-corner-mark-left-color);
    padding: 0 8px;

    .icon-setting {
      margin-left: 4px;
      margin-bottom: 2px;
    }
  }

  .corner-mark-bottom-right {
    position: absolute;
    font-size: 12px;
    right: -1px;
    color: var(--ti-lowcode-canvas-corner-mark-bottom-right-color);
    bottom: -20px;
    background: var(--ti-lowcode-canvas-corner-mark-bottom-right-bg-color);
    border: 1px solid var(--ti-lowcode-canvas-corner-mark-bottom-right-border-color);
    padding: 0 2px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .corner-mark-right {
    display: flex;
    align-items: center;
    position: absolute;
    right: -1px;
    height: 24px;
    padding: 0 4px;
    color: var(--ti-lowcode-canvas-corner-mark-right-color);
    background: var(--ti-lowcode-canvas-corner-mark-right-bg-color);
    pointer-events: all;
    cursor: pointer;

    div {
      font-size: 0;

      svg {
        margin: 0 4px;
        font-size: 16px;
      }
    }
  }

  &.select {
    z-index: 3;
    border-width: 2px;

    .corner-mark-left {
      white-space: nowrap;
      pointer-events: all;
      left: -2px;
      color: var(--ti-lowcode-canvas-select-corner-mark-left-color);
      background: var(--ti-lowcode-canvas-select-corner-mark-left-bg-color);
      svg {
        cursor: pointer;
      }
    }
  }
}
.short-cut-set.tiny-popper.tiny-popover {
  background: var(--ti-lowcode-toolbar-bg);
  padding: 10px;
  .body label,
  .header {
    color: var(--ti-lowcode-dialog-font-color);
    font-size: 12px;
  }
  .tiny-popover__title {
    color: var(--ti-lowcode-dialog-font-color);
  }
}

.short-cut-set.tiny-popper.tiny-popover[x-placement^='bottom'] .popper__arrow::after {
  border-bottom-color: var(--ti-lowcode-toolbar-bg);
}

.drag-resize {
  position: absolute;
  top: -6px;
  bottom: -6px;
  left: -6px;
  right: -6px;
  height: 6px;
  width: 6px;
  background-color: #409eff;
  cursor: pointer;
  pointer-events: auto !important;
  &.resize-top {
    left: calc(50% - 3px);
    cursor: n-resize;
  }
  &.resize-bottom {
    left: calc(50% - 3px);
    top: auto;
    cursor: s-resize;
  }
  &.resize-left {
    top: calc(50% - 3px);
    cursor: e-resize;
  }
  &.resize-right {
    top: calc(50% - 3px);
    left: auto;
    cursor: e-resize;
  }
  &.resize-top-left {
    cursor: nw-resize;
  }
  &.resize-top-right {
    left: auto;
    cursor: ne-resize;
  }
  &.resize-bottom-left {
    top: auto;
    cursor: sw-resize;
  }
  &.resize-bottom-right {
    left: auto;
    top: auto;
    cursor: se-resize;
  }
}
</style>
