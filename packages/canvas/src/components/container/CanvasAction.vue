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
      <div
        class="drag-resize resize-top"
        draggable="true"
        @mousedown.stop="onMousedown($event, 'center', 'start')"
      ></div>
      <div
        class="drag-resize resize-bottom"
        draggable="true"
        @mousedown.stop="onMousedown($event, 'center', 'end')"
      ></div>
      <div
        class="drag-resize resize-left"
        draggable="true"
        @mousedown.stop="onMousedown($event, 'start', 'center')"
      ></div>
      <div
        class="drag-resize resize-right"
        draggable="true"
        @mousedown.stop="onMousedown($event, 'end', 'center')"
      ></div>
      <div
        class="drag-resize resize-top-left"
        draggable="true"
        @mousedown.stop="onMousedown($event, 'start', 'start')"
      ></div>
      <div
        class="drag-resize resize-top-right"
        draggable="true"
        @mousedown.stop="onMousedown($event, 'end', 'start')"
      ></div>
      <div
        class="drag-resize resize-bottom-left"
        draggable="true"
        @mousedown.stop="onMousedown($event, 'start', 'end')"
      ></div>
      <div
        class="drag-resize resize-bottom-right"
        draggable="true"
        @mousedown.stop="onMousedown($event, 'end', 'end')"
      ></div>
    </template>
    <div v-if="showAction" ref="optionRef" class="corner-mark-right" :style="fixStyle">
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
    <div :class="['hover-line', lineState.position, { forbidden: lineState.forbidden }]">
      <div v-if="lineState.position === 'in' && hoverState.configure" class="choose-slots"></div>
    </div>
  </div>
</template>
<script>
import { watchPostEffect, ref, watch, computed, nextTick } from 'vue'
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
  canvasState,
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
import { useLayout, useResource } from '@opentiny/tiny-engine-controller'
import { Popover } from '@opentiny/vue'
import shortCutPopover from './shortCutPopover.vue'

// 工具操作条高度
const OPTION_BAR_HEIGHT = 24
// 标签高度
const LABEL_HEIGHT = 24

// 画布右边滚动条宽度
const SCROLL_BAR_WIDTH = 8

// 当工具操作条和标签高度并排显示时，需要的间距 6px
const OPTION_SPACE = 6

// 选中框的边框宽度
const SELECTION_BORDER_WIDTH = 2

const STYLE_UNSET = 'unset'

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

    const optionRef = ref(null)
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

    const positions = {
      LEFT: 'left',
      RIGHT: 'right',
      TOP: 'top',
      BOTTOM: 'bottom',
      isHorizontal(position) {
        return [this.LEFT, this.RIGHT].includes(position)
      },
      isVertical(position) {
        return [this.TOP, this.BOTTOM].includes(position)
      }
    }

    class Align {
      alignLeft = false
      horizontalValue = 0
      alignTop = false
      verticalValue = 0

      constructor({ alignLeft, horizontalValue, alignTop, verticalValue }) {
        this.alignLeft = alignLeft
        this.horizontalValue = horizontalValue
        this.alignTop = alignTop
        this.verticalValue = verticalValue
      }

      align(position, value = 0) {
        if (positions.isHorizontal(position)) {
          this.alignLeft = position === positions.LEFT
          this.horizontalValue = value
          return this
        }
        if (positions.isVertical(position)) {
          this.alignTop = position === positions.TOP
          this.horizontalValue = value
          return this
        }
        return this
      }

      toStyleValue() {
        const styleObj = {}

        if (this.alignLeft) {
          styleObj.left = this.horizontalValue
          styleObj.right = STYLE_UNSET
        } else {
          styleObj.right = this.horizontalValue
          styleObj.left = STYLE_UNSET
        }

        if (this.alignTop) {
          styleObj.top = this.verticalValue
          styleObj.bottom = STYLE_UNSET
        } else {
          styleObj.bottom = this.verticalValue
          styleObj.top = STYLE_UNSET
        }

        return this.styleObj2Str(styleObj)
      }

      styleObj2Str = (styleObj) => {
        return Object.entries(styleObj)
          .map(([key, value]) => {
            const num = Number(value)

            if (Number.isNaN(num)) {
              return `${key}:${value}`
            }

            const val = positions.isHorizontal(key) ? num - SELECTION_BORDER_WIDTH : num
            return `${key}:${val}px`
          })
          .join(';')
      }
    }

    const getStyleValues = (selectState, canvasSize, labelWidth, optionWidth) => {
      const { left, top, width, height, doc } = selectState
      const { width: canvasWidth, height: canvasHeight } = canvasSize
      // 标签宽度和工具操作条宽度之和加上间距
      const fullRectWidth = labelWidth + optionWidth + OPTION_SPACE

      // 是否 将label 标签放置到底部，判断 top 距离
      const isLabelAtBottom = top < LABEL_HEIGHT
      const labelAlign = new Align({
        alignLeft: true,
        horizontalValue: 0,
        alignTop: !isLabelAtBottom,
        verticalValue: -LABEL_HEIGHT
      })

      // 是否将操作栏放置到底部，判断当前选中组件底部与页面底部的距离。
      const isOptionAtBottom = canvasHeight - top - height >= OPTION_BAR_HEIGHT
      const optionAlign = new Align({
        alignLeft: false,
        horizontalValue: 0,
        alignTop: !isOptionAtBottom,
        verticalValue: -OPTION_BAR_HEIGHT
      })

      const scrollBarWidth = doc.documentElement.scrollHeight > doc.documentElement.clientHeight ? SCROLL_BAR_WIDTH : 0

      if (width < fullRectWidth) {
        // 选中框宽度小于标签宽度和工具操作条宽度之和加上间距

        // 如果labe宽度大于选中框宽度，并且label右侧已经超出画布，则label对齐右侧
        const isLabelAlignRight = labelWidth > width && left + labelWidth + scrollBarWidth > canvasWidth
        if (isLabelAlignRight) {
          labelAlign.align(positions.RIGHT)
        }

        // 如果option宽度大于选中框宽度，并且option左侧已经超出画布，则option对齐左侧
        const isOptionAlignLeft = optionWidth > width && left + width - optionWidth < 0
        if (isOptionAlignLeft) {
          optionAlign.align(positions.LEFT)
        }

        if (isLabelAtBottom === isOptionAtBottom) {
          // 标签框和工具操作框都在顶部或者都在底部

          if (left + fullRectWidth < canvasWidth) {
            // 都放在左侧
            labelAlign.align(positions.LEFT)
            optionAlign.align(positions.LEFT, labelWidth + OPTION_SPACE)
          } else {
            // 都放在右侧
            optionAlign.align(positions.RIGHT)
            labelAlign.align(positions.RIGHT, optionWidth + OPTION_SPACE)
          }
        }
      } else {
        if (left < 0) {
          labelAlign.align(positions.LEFT, Math.min(-left, width - fullRectWidth))
        }

        if (left + width + scrollBarWidth > canvasWidth) {
          optionAlign.align(
            positions.RIGHT,
            Math.min(left + width + scrollBarWidth - canvasWidth, width - fullRectWidth)
          )
        }
      }

      return {
        labelStyleValue: labelAlign.toStyleValue(),
        optionStyleValue: optionAlign.toStyleValue()
      }
    }

    watchPostEffect(async () => {
      const { left, top, width, height, doc } = props.selectState

      // nextTick后ref才能获取到元素。需要把监听的依赖放在await之前，否则无法监听变化
      await nextTick()

      if (labelRef.value && !optionRef.value) {
        // 选中body的情况
        labelStyle.value = `left: 0; right: unset; top: unset; bottom: 0`
        return
      }

      if (!labelRef.value || !optionRef.value) {
        return
      }

      const scale = useLayout().getScale()
      const canvasRect = canvasState.iframe.getBoundingClientRect()
      const { width: labelWidth } = labelRef.value.getBoundingClientRect()
      const { width: optionWidth } = optionRef.value.getBoundingClientRect()

      // canvas容器中，iframe以及iframe之外的元素clientRect的尺寸都是缩放过的，除以scale得到原始大小
      const { labelStyleValue, optionStyleValue } = getStyleValues(
        { left, top, width, height, doc },
        { width: canvasRect.width / scale, height: canvasRect.height / scale },
        labelWidth / scale,
        optionWidth / scale
      )

      labelStyle.value = labelStyleValue
      fixStyle.value = optionStyleValue
    })

    return {
      remove,
      moveUp,
      moveDown,
      copy,
      hide,
      selectParent,
      optionRef,
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
  position: absolute;
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
    &.forbidden:not(.in) {
      background: var(--ti-lowcode-canvas-hover-line-forbid-bg-color);
    }
    &.forbidden.in {
      background: var(--ti-lowcode-canvas-hover-line-in-forbid-bg-color);
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
