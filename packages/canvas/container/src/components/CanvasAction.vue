<template>
  <div
    v-show="selectState.height && selectState.width"
    :class="['canvas-rect select', { 'multi-select': multiStateLength > 1 }, { dragging: isMultiDragging }]"
    :style="{
      top: selectState.top + 'px',
      left: selectState.left + 'px',
      height: selectState.height + 'px',
      width: selectState.width + 'px'
    }"
  >
    <div v-if="showQuickAction" ref="labelRef" class="corner-mark-left" :style="labelStyle">
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
          <icon-setting class="icon-setting svg-currentcolor" @click.stop="showPopover = !showPopover"></icon-setting>
        </template>
      </TinyPopover>
    </div>
    <!-- 绝对定位画布时调节元素大小 -->
    <template v-else>
      <div
        :class="[showAction && 'drag-resize', 'resize-top']"
        draggable="true"
        @mousedown.stop="onMousedown($event, 'center', 'start')"
      ></div>
      <div
        :class="[showAction && 'drag-resize', 'resize-bottom']"
        draggable="true"
        @mousedown.stop="onMousedown($event, 'center', 'end')"
      ></div>
      <div
        :class="[showAction && 'drag-resize', 'resize-left']"
        draggable="true"
        @mousedown.stop="onMousedown($event, 'start', 'center')"
      ></div>
      <div
        :class="[showAction && 'drag-resize', 'resize-right']"
        draggable="true"
        @mousedown.stop="onMousedown($event, 'end', 'center')"
      ></div>
      <div
        :class="[showAction && 'drag-resize', 'resize-left']"
        draggable="true"
        @mousedown.stop="onMousedown($event, 'start', 'start')"
      ></div>
      <div
        :class="[showAction && 'drag-resize', 'resize-top-right']"
        draggable="true"
        @mousedown.stop="onMousedown($event, 'end', 'start')"
      ></div>
      <div
        :class="[showAction && 'drag-resize', 'resize-bottom-left']"
        draggable="true"
        @mousedown.stop="onMousedown($event, 'start', 'end')"
      ></div>
      <div
        :class="[showAction && 'drag-resize', 'resize-bottom-right']"
        draggable="true"
        @mousedown.stop="onMousedown($event, 'end', 'end')"
      ></div>
    </template>
    <div v-if="showAction" ref="optionRef" class="corner-mark-right" :style="fixStyle">
      <template v-if="!isModal">
        <div v-if="showToParent" title="选择父级">
          <icon-chevron-left class="svg-currentcolor" @click.stop="selectParent"></icon-chevron-left>
        </div>
        <div title="向上移动">
          <icon-arrow-up class="svg-currentcolor" @click.stop="moveUp"></icon-arrow-up>
        </div>
        <div title="向下移动">
          <icon-arrow-down class="svg-currentcolor" @click.stop="moveDown"></icon-arrow-down>
        </div>
        <div title="复制">
          <icon-copy class="svg-currentcolor" @click.stop="copy"></icon-copy>
        </div>
      </template>
      <template v-else>
        <div title="隐藏">
          <icon-eyeclose class="svg-currentcolor" @click.stop="hide"></icon-eyeclose>
        </div>
      </template>
      <div title="删除">
        <icon-del class="svg-currentcolor" @click.stop="remove"></icon-del>
      </div>
      <!-- AI助手按钮（默认状态：隐藏） -->
      <div title="AI助手" class="ai-helper">
        <TinyPopover
          v-model="showAIPopover"
          placement="bottom-start"
          width="360"
          popper-class="ai-popper"
          trigger="manual"
          :visible-arrow="false"
        >
          <CanvasAIChat
            v-if="shouldShowAIChat"
            class="ai-component"
            @complete="handleAIChatComplete"
            @close="closeAIHelper"
          ></CanvasAIChat>
          <AILoadingDialog
            v-if="shouldShowAILoading"
            class="ai-component"
            @cancel="handleAILoadingCancel"
          ></AILoadingDialog>
          <AIConfirmDialog
            v-if="shouldShowAIConfirm"
            class="ai-component"
            @confirm="handleAIConfirm"
            @cancel="handleAICancel"
            @refresh="handleAIRefresh"
          ></AIConfirmDialog>
          <template #reference>
            <svg-icon name="add-group" @click.stop="openAIHelper"></svg-icon>
          </template>
        </TinyPopover>
      </div>
    </div>
  </div>
  <div v-show="hoverState.height && hoverState.width" class="canvas-rect hover">
    <div class="corner-mark-left">
      {{ hoverState.componentName }}
    </div>
    <div v-show="hoverState.configure?.isContainer" class="corner-mark-bottom-right">拖放元素到容器内</div>
  </div>
  <div v-show="inactiveHoverState.height && inactiveHoverState.width" class="canvas-rect inactive-hover">
    <div class="corner-mark-left">
      {{ inactiveHoverState.componentName }}
    </div>
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
  dragStart,
  getCurrentElement,
  querySelectById
} from '../container'
import { useLayout, useMaterial, useCanvas, useMessage } from '@opentiny/tiny-engine-meta-register'
import { Popover } from '@opentiny/vue'
import shortCutPopover from './shortCutPopover.vue'
import CanvasAIChat from './CanvasAIChat.vue'
import AIConfirmDialog from './AIConfirmDialog.vue'
import AILoadingDialog from './AILoadingDialog.vue'
import { chat } from '../services/agentServices'
import { utils } from '@opentiny/tiny-engine-utils'
import useAIChat from '../composables/useAIChat'

const { deepClone } = utils

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
    AILoadingDialog,
    CanvasAIChat,
    AIConfirmDialog,
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
    inactiveHoverState: {
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
    multiStateLength: {
      type: Number,
      default: () => 0
    },
    resize: {
      type: Boolean,
      default: false
    },
    isMultiDragging: {
      type: Boolean,
      default: false
    },
    windowGetClickEventTarget: Object
  },
  emits: ['remove', 'selectSlot', 'setting'],
  setup(props) {
    const { pageState: _pageState, getNode } = useCanvas()

    const {
      getNodeAIStatus,
      openNodeAIChat,
      closeNodeAIHelper,
      startNodeAILoading,
      cancelNodeAILoading,
      shouldShowNodeAIChat,
      shouldShowNodeAILoading,
      shouldShowNodeAIConfirm,
      confirmNodeAIAction,
      updateNodeAIStatus,
      cancelNodeAIAction,
      applyAIPatches,
      buildAIChatRequest
    } = useAIChat()

    // AI请求的AbortController，用于取消正在进行的请求
    let aiChatAbortController = null
    // 递增token，用于防止并发请求的响应竞争
    let aiChatRequestToken = 0

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
          ;[list[index], list[toIndex]] = [list[toIndex], list[index]]

          useMessage().publish({ topic: 'schemaChange', data: {} })
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
      const parent = getCurrent().parent
      const parentId = parent?.id

      if (parent?.componentName === 'Template' && !querySelectById(parentId)) {
        const grandParent = useCanvas().getNodeWithParentById(parentId)?.parent

        if (grandParent) {
          selectNode(grandParent?.id)
        }
      } else if (parentId) {
        selectNode(parentId)
      }
    }

    const copy = () => {
      copyNode(getCurrent().schema.id)
    }

    const hide = () => {
      if (getCurrent().schema?.id) {
        const { clearSelect } = useCanvas().canvasApi.value
        getRenderer().setCondition(getCurrent().schema.id, false)
        useCanvas().pageState.nodesStatus[getCurrent().schema.id] = false
        clearSelect()
      }
      updateRect()
    }

    const isSingleNode = computed(() => {
      return props.multiStateLength < 2
    })

    const showAction = computed(() => {
      const { schema, parent } = getCurrent()
      if (schema?.props?.['data-id'] === 'root-container') {
        return false
      }
      return !props.resize && parent && parent?.type !== 'JSSlot' && isSingleNode.value
    })

    const showQuickAction = computed(() => {
      return !props.resize && isSingleNode.value
    })

    const showToParent = computed(() => getCurrent().parent !== useCanvas().getSchema())

    const isModal = computed(() => {
      const config = useMaterial().getMaterial(props.selectState.componentName)
      return config?.configure?.isModal
    })

    // 是否显示AI聊天界面
    const shouldShowAIChat = computed(() => {
      const currentSchema = getCurrent().schema
      if (!currentSchema?.id) {
        return false
      }

      return shouldShowNodeAIChat(currentSchema.id)
    })

    // 是否显示确认弹窗
    const shouldShowAIConfirm = computed(() => {
      const currentSchema = getCurrent().schema
      if (!currentSchema?.id) {
        return false
      }

      return shouldShowNodeAIConfirm(currentSchema.id)
    })

    // 是否显示AI加载状态
    const shouldShowAILoading = computed(() => {
      const currentSchema = getCurrent().schema
      if (!currentSchema?.id) {
        return false
      }

      return shouldShowNodeAILoading(currentSchema.id)
    })

    const showAIPopover = ref(false)
    watch(
      () => {
        const currentSchema = getCurrent().schema
        if (!currentSchema?.id) {
          return false
        }
        const status = getNodeAIStatus(currentSchema?.id)
        return status?.state !== 'hidden' && !status?.collapsed
      },
      (val) => {
        showAIPopover.value = val
      }
    )

    // 切换AI助手显示/隐藏
    const openAIHelper = () => {
      const currentSchema = getCurrent().schema

      if (!currentSchema?.id) {
        return
      }

      const currentStatus = getNodeAIStatus(currentSchema.id)

      if (currentStatus && currentStatus.collapsed) {
        // 面板已收起，重新展开恢复原状态
        updateNodeAIStatus(currentSchema.id, { collapsed: false })
      } else if (currentStatus && currentStatus.state !== 'hidden') {
        // 面板当前可见，收起面板但保留业务状态
        updateNodeAIStatus(currentSchema.id, { collapsed: true })
      } else {
        // hidden状态，进入chat
        openNodeAIChat(currentSchema.id)
      }
    }

    // 关闭AI助手（由其他组件调用，如AI聊天界面的关闭按钮）
    const closeAIHelper = () => {
      const currentSchema = getCurrent().schema
      if (!currentSchema?.id) {
        return
      }

      const currentStatus = getNodeAIStatus(currentSchema.id)
      // loading/confirm状态下只收起面板，保留状态以便重新打开恢复
      if (currentStatus && (currentStatus.state === 'loading' || currentStatus.state === 'confirm')) {
        updateNodeAIStatus(currentSchema.id, { collapsed: true })
      } else {
        closeNodeAIHelper(currentSchema.id)
      }
    }

    const optionRef = ref(null)
    const fixStyle = ref('')

    const showPopover = ref(false)

    const activeSetting = () => {
      showPopover.value = false
    }

    const findParentHasClass = (target) => {
      const parent = target.parentNode

      if (parent.className === undefined) {
        return false
      }

      const name = JSON.stringify(parent.className)

      const preventClassNameList = ['short-cut-set', 'tiny-dialog-box', 'icon-popover', 'i18n-input-popover']

      if (preventClassNameList.some((item) => name?.includes(item))) {
        return true
      }

      return findParentHasClass(parent)
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
          const flag = findParentHasClass(newProps)
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

    /**
     * 检查元素在画布中的可用空间
     * @param {number} top - 选中元素顶部位置
     * @param {number} selectedHeight - 选中元素高度
     * @param {number} canvasHeight - 画布高度
     * @param {number} elementHeight - 要放置元素的高度
     * @returns {{hasTopSpace: boolean, hasBottomSpace: boolean}}
     */
    const checkElementSpace = (top, selectedHeight, canvasHeight, elementHeight) => {
      return {
        hasTopSpace: top >= elementHeight,
        hasBottomSpace: canvasHeight - top - selectedHeight >= elementHeight
      }
    }

    /**
     * 根据策略决定元素应该放置在顶部还是底部
     * @param {number} top - 选中元素顶部位置
     * @param {number} elementHeight - 要放置元素的高度
     * @param {boolean} hasTopSpace - 顶部是否有足够空间
     * @param {boolean} hasBottomSpace - 底部是否有足够空间
     * @param {string} strategy - 放置策略 ('topFirst' | 'bottomFirst')
     * @returns {boolean} 是否放置在底部
     */
    const determineElementPosition = (hasTopSpace, hasBottomSpace, strategy = 'topFirst') => {
      if (strategy === 'bottomFirst') {
        // Option策略：优先底部，或顶部没空间时放底部
        return hasBottomSpace || !hasTopSpace
      } else {
        // Label策略：顶部没空间且底部有空间才放底部
        return !hasTopSpace && hasBottomSpace
      }
    }

    /**
     * 通用的垂直对齐计算函数
     * @param {boolean} isAtBottom - 是否放置在底部
     * @param {number} elementHeight - 元素高度
     * @param {boolean} hasTopSpace - 顶部是否有足够空间
     * @param {boolean} hasBottomSpace - 底部是否有足够空间
     * @param {boolean} bottomFirst - 是否底部优先策略（true: Option策略, false: Label策略）
     * @returns {{alignTop: boolean, verticalValue: number}}
     */
    const calculateVerticalAlignment = (
      isAtBottom,
      elementHeight,
      hasTopSpace,
      hasBottomSpace,
      bottomFirst = false
    ) => {
      const alignTop = !isAtBottom

      let verticalValue
      if (bottomFirst) {
        // Option策略：不在底部 OR 底部有空间时偏移
        verticalValue = !isAtBottom || hasBottomSpace ? -elementHeight : 0
      } else {
        // Label策略：在底部 OR 顶部有空间时偏移
        verticalValue = isAtBottom || hasTopSpace ? -elementHeight : 0
      }

      return { alignTop, verticalValue }
    }

    /**
     * 一站式元素对齐计算函数（组合了空间检查、位置决策、对齐计算）
     * @param {number} top - 选中元素顶部位置
     * @param {number} selectedHeight - 选中元素高度
     * @param {number} canvasHeight - 画布高度
     * @param {number} elementHeight - 要放置元素的高度
     * @param {string} strategy - 放置策略 ('topFirst' | 'bottomFirst')
     * @returns {{alignTop: boolean, verticalValue: number}}
     */
    const calculateElementAlignment = (top, selectedHeight, canvasHeight, elementHeight, strategy = 'topFirst') => {
      const spaceInfo = checkElementSpace(top, selectedHeight, canvasHeight, elementHeight)
      const isAtBottom = determineElementPosition(spaceInfo.hasTopSpace, spaceInfo.hasBottomSpace, strategy)
      return calculateVerticalAlignment(
        isAtBottom,
        elementHeight,
        spaceInfo.hasTopSpace,
        spaceInfo.hasBottomSpace,
        strategy === 'bottomFirst'
      )
    }

    const getStyleValues = (selectState, canvasSize, labelWidth, optionWidth) => {
      const { left, top, width, height, doc } = selectState
      const { width: canvasWidth, height: canvasHeight } = canvasSize
      // 标签宽度和工具操作条宽度之和加上间距
      const fullRectWidth = labelWidth + optionWidth + OPTION_SPACE
      const labelAlignment = calculateElementAlignment(
        top,
        height,
        canvasHeight,
        LABEL_HEIGHT,
        'topFirst' // Label策略：顶部优先
      )

      const labelAlign = new Align({
        alignLeft: true,
        horizontalValue: 0,
        alignTop: labelAlignment.alignTop,
        verticalValue: labelAlignment.verticalValue
      })

      if (!doc) {
        return {}
      }

      const optionAlignment = calculateElementAlignment(
        top,
        height,
        canvasHeight,
        OPTION_BAR_HEIGHT,
        'bottomFirst' // Option策略：底部优先
      )

      const optionAlign = new Align({
        alignLeft: false,
        horizontalValue: 0,
        alignTop: optionAlignment.alignTop,
        verticalValue: optionAlignment.verticalValue
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

        if (labelAlignment.alignTop === optionAlignment.alignTop) {
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

      // template上虽然已经判断了showQuickAction，这里再加上主要是为了watchPostEffect能够监听它，然后刷新action
      if (!showQuickAction.value) {
        return
      }

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

    // AI聊天完成处理
    const handleAIChatComplete = async (content) => {
      const currentSchema = getCurrent().schema
      if (!currentSchema?.id) {
        return
      }

      // 先进入加载状态
      startNodeAILoading(currentSchema.id, 'AI正在处理您的请求...')

      // 在AI修改节点前，先刷新originalNodeData为当前最新节点数据
      // 避免取消/重新生成时回滚到过期的快照，丢失用户之前的普通编辑
      const currentNode = getNode(currentSchema.id)
      if (currentNode) {
        const currentStatus = getNodeAIStatus(currentSchema.id)
        if (currentStatus) {
          currentStatus.originalNodeData = deepClone(currentNode)
        }
      }

      // 创建新的AbortController用于取消请求，递增token防止响应竞争
      aiChatAbortController = new AbortController()
      const currentToken = ++aiChatRequestToken

      try {
        const params = await buildAIChatRequest(content)
        const response = await chat(params, aiChatAbortController.signal)

        // 响应到达后校验token：如果有更新的请求已经发出，丢弃本次响应
        if (currentToken !== aiChatRequestToken) {
          return
        }

        // 响应到达后再次检查：如果用户已经取消，不应用AI补丁
        const status = getNodeAIStatus(currentSchema.id)
        if (!status || status.state !== 'loading') {
          return
        }

        // AI运行完：设置chatContent、aiModifiedNodeData，修改画布schema为AI的schema
        // 应用失败则取消loading，避免UI永久转圈
        if (!applyAIPatches(currentSchema.id, response, content)) {
          cancelNodeAILoading(currentSchema.id)
        }
      } catch (error) {
        // 请求被取消时不再应用补丁
        if (error.name === 'AbortError' || error.name === 'CanceledError') {
          return
        }
        // 其他错误：取消loading状态，避免UI永久转圈
        cancelNodeAILoading(currentSchema.id)
      }
    }

    // AI加载取消处理
    const handleAILoadingCancel = () => {
      const currentSchema = getCurrent().schema
      if (!currentSchema?.id) {
        return
      }

      // 中止正在进行的AI请求
      if (aiChatAbortController) {
        aiChatAbortController.abort()
        aiChatAbortController = null
        // 递增token，使任何未完成的请求响应失效
        aiChatRequestToken++
      }

      // 取消加载状态
      cancelNodeAILoading(currentSchema.id)
    }

    // 刷新AI操作（重新生成）
    // 逻辑：修改画布节点schema为originalNodeData，设置aiModifiedNodeData为空，重新发起请求
    const handleAIRefresh = async () => {
      const currentSchema = getCurrent().schema
      if (!currentSchema?.id) {
        return
      }

      const nodeId = currentSchema.id
      const currentAIStatus = getNodeAIStatus(nodeId)
      if (!currentAIStatus) {
        return
      }

      // 恢复画布节点schema为originalNodeData，同步重建nodesMap
      if (currentAIStatus.originalNodeData) {
        const { restoreNodeSubtree } = useCanvas()
        restoreNodeSubtree(nodeId, deepClone(currentAIStatus.originalNodeData))
        useMessage().publish({ topic: 'schemaChange', data: { nodeId } })
      }

      // 设置aiModifiedNodeData为空
      updateNodeAIStatus(nodeId, {
        aiModifiedNodeData: undefined
      })

      // 重新进入加载状态
      startNodeAILoading(nodeId, 'AI正在重新生成...')

      // 使用上次的聊天消息重新发起请求
      const chatContent = currentAIStatus.chatContent
      if (!chatContent) {
        cancelNodeAILoading(nodeId)
        return
      }

      try {
        const params = await buildAIChatRequest(chatContent)
        // 创建新的AbortController用于重新生成的请求，递增token防止响应竞争
        const refreshToken = ++aiChatRequestToken
        aiChatAbortController = new AbortController()
        const response = await chat(params, aiChatAbortController.signal)

        // 响应到达后校验token：如果有更新的请求已经发出，丢弃本次响应
        if (refreshToken !== aiChatRequestToken) {
          return
        }

        // 响应到达后检查是否已被取消
        const status = getNodeAIStatus(nodeId)
        if (!status || status.state !== 'loading') {
          return
        }

        // AI运行完操作和 handleAIChatComplete 一样，应用失败则取消loading
        if (!applyAIPatches(nodeId, response, chatContent)) {
          cancelNodeAILoading(nodeId)
        }
      } catch (error) {
        // 请求被取消时不做额外处理
        if (error.name === 'AbortError' || error.name === 'CanceledError') {
          return
        }
        cancelNodeAILoading(nodeId)
      }
    }

    // 确认AI操作
    const handleAIConfirm = () => {
      const currentSchema = getCurrent().schema
      if (!currentSchema?.id) {
        return
      }

      confirmNodeAIAction(currentSchema.id)
    }

    // 取消AI操作
    const handleAICancel = () => {
      const currentSchema = getCurrent().schema
      if (!currentSchema?.id) {
        return
      }

      cancelNodeAIAction(currentSchema.id)
    }

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
      showQuickAction,
      showPopover,
      showToParent,
      showAIPopover,
      activeSetting,
      isModal,
      onMousedown,
      labelStyle,
      labelRef,
      openAIHelper,
      shouldShowAIChat,
      shouldShowAILoading,
      shouldShowAIConfirm,
      closeAIHelper,
      handleAIChatComplete,
      handleAILoadingCancel,
      handleAIConfirm,
      handleAICancel,
      handleAIRefresh
    }
  }
}
</script>

<style lang="less">
.canvas-rect {
  position: absolute;
  box-sizing: border-box;
  pointer-events: none;
  border: 1px solid var(--te-canvas-container-border-color-checked);
  z-index: 2;
  // 禁止文本选择
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;

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
  &.inactive-hover {
    border-style: dashed;
    top: v-bind("inactiveHoverState.top + 'px'");
    left: v-bind("inactiveHoverState.left + 'px'");
    height: v-bind("inactiveHoverState.height + 'px'");
    width: v-bind("inactiveHoverState.width + 'px'");
    border-color: var(--te-canvas-container-border-color-hover);

    .corner-mark-left {
      height: 14px;
      top: -14px;
      padding-left: 0;
      font-size: 12px;
      color: var(--te-canvas-container-text-color-weaken);
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
      background: var(--te-canvas-container-text-color-checked);
      position: absolute;
      top: -3px;
    }
    &.left {
      width: 5px;
      height: 100%;
      background: var(--te-canvas-container-text-color-checked);
      position: absolute;
      left: -3px;
    }
    &.bottom {
      width: 100%;
      height: 5px;
      background: var(--te-canvas-container-text-color-checked);
      position: absolute;
      bottom: -3px;
    }
    &.right {
      width: 5px;
      height: 100%;
      background: var(--te-canvas-container-text-color-checked);
      position: absolute;
      right: -3px;
    }
    &.in {
      width: 100%;
      height: 100%;
      background: var(--te-canvas-container-hover-line-in-bg-color);
    }
    &.forbidden:not(.in) {
      background: var(--te-canvas-container-hover-line-forbid-bg-color);
    }
    &.forbidden.in {
      background: var(--te-canvas-container-hover-line-in-forbid-bg-color);
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
      border: 1px solid var(--te-canvas-container-border-color-checked);
      color: var(--te-canvas-container-choose-slot-text-color);
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
    color: var(--te-canvas-container-corner-mark-left-text-color);
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
    color: var(--te-canvas-container-text-color-white);
    bottom: -20px;
    background: var(--te-canvas-container-bg-color-checked);
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
    color: var(--te-canvas-container-text-color-white);
    background: var(--te-canvas-container-bg-color-checked);
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
      color: var(--te-canvas-container-text-color-white);
      background: var(--te-canvas-container-bg-color-checked);
      svg {
        cursor: pointer;
      }
    }
  }

  &.multi-select {
    border-color: var(--te-canvas-container-border-color-checked);
    border-style: solid;
    border-width: 2px;

    .corner-mark-left {
      background-color: var(--te-canvas-container-bg-color-checked);
      color: var(--te-canvas-container-text-color-white);
    }

    &.dragging {
      opacity: 0.7;
      border-color: var(--te-canvas-container-border-color-multi, #1890ff);
      border-style: dashed;
      border-width: 2px;
      background-color: rgba(24, 144, 255, 0.15);
      box-shadow: 0 0 12px rgba(24, 144, 255, 0.4);
      transition: all 0.2s ease;
      animation: pulse-border 1.5s infinite;

      .corner-mark-left {
        background-color: var(--te-canvas-container-border-color-multi, #1890ff);
        animation: pulse-bg 1.5s infinite;
      }
    }
  }
}

@keyframes pulse-border {
  0% {
    box-shadow: 0 0 0 0 rgba(24, 144, 255, 0.4);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(24, 144, 255, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(24, 144, 255, 0);
  }
}

@keyframes pulse-bg {
  0% {
    background-color: rgba(24, 144, 255, 1);
  }
  50% {
    background-color: rgba(24, 144, 255, 0.7);
  }
  100% {
    background-color: rgba(24, 144, 255, 1);
  }
}

.short-cut-set.short-cut-set.tiny-popper.tiny-popover {
  .tiny-popover__title {
    color: var(--te-canvas-container-text-color-primary);
    font-size: 14px;
  }
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

.ai-helper {
  position: relative;
  .ai-component,
  .ai-component-loading {
    position: absolute;
    right: 0;
    width: 360px;
    opacity: 0;
    transform: translateY(-10px);
    animation: slideIn 0.2s ease-in-out forwards;
  }
  .ai-component-loading {
    width: 270px;
  }
}
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(10px);
  }
}
.ai-popper.ai-popper.tiny-popper.tiny-popover {
  padding: 0;
  border-radius: 40px;
}
</style>
