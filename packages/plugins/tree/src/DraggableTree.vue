<template>
  <!-- TODO 后续抽取公共逻辑，迁移至公共组件 -->
  <div class="draggable-tree" @dragleave="handleDragLeaveContainer">
    <div
      v-for="row in rows"
      :key="row.id"
      v-show="!row.collapsed"
      :class="[
        'tree-row',
        'flex-center',
        {
          active: active === row.id,
          dragging: draggingState.hovering?.id === row.id,
          'border-all': draggingState.hovering?.id === row.id && draggingState.position === 'center',
          forbid: draggingState.forbidInsert
        }
      ]"
      :draggable="draggable ? 'true' : undefined"
      @click="handleClickRow(row)"
      @mouseenter="handleMouseEnterRow(row)"
      @dragstart="handleDragStart($event, row)"
      @dragover="handleDragOver($event, row)"
      @dragenter="handleDragOver($event, row)"
      @drop="handleDrop"
      @dragend="handleDragEnd"
    >
      <div class="content flex-center" :style="{ paddingLeft: `${12 * row.level}px` }">
        <span v-if="!row.hasChildren" class="expand-icon"></span>
        <svg-icon
          v-if="row.hasChildren"
          name="dropdown"
          :class="['expand-icon', { rotate: collapseMap[row.id] }]"
          @click.stop="switchCollapse(row.id)"
        ></svg-icon>
        <div
          :class="[
            'slot-content',
            'flex-center',
            {
              [draggingState.borderClass]: draggingState.hovering?.id === row.id && draggingState.position !== 'center',
              forbid: draggingState.forbidInsert
            }
          ]"
        >
          <slot name="content" v-bind="row"></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, defineEmits, defineProps, reactive, ref } from 'vue'

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  },
  active: {
    type: String
  },
  idKey: {
    type: String,
    default: 'id'
  },
  labelKey: {
    type: String,
    default: 'label'
  },
  childrenKey: {
    type: String,
    default: 'children'
  },
  draggable: {
    type: Boolean,
    default: false
  },
  disallowDrop: {
    type: Function,
    default: () => false
  }
})

/**
 * @typedef {Object} Node
 * @property {string} id
 * @property {string} label
 * @property {Node[]} [children]
 * @property {any} rawData
 */

/**
 *
 * @param dataItem
 * @returns {Node}
 */
const normalizeDataItem = (dataItem) => {
  const { idKey, labelKey, childrenKey } = props

  const id = dataItem[idKey]
  const label = dataItem[labelKey]
  const children = dataItem[childrenKey]

  const result = { id, label, rawData: dataItem }

  if (Array.isArray(children)) {
    result.children = children.map((child) => normalizeDataItem(child))
  }

  return result
}

const normalizeData = (data) => {
  if (!Array.isArray(data)) {
    return []
  }

  return data.map((item) => normalizeDataItem(item))
}

const normalizedData = computed(() => normalizeData(props.data))

const useCollapseMap = () => {
  const collapseMap = ref({})

  const setCollapse = (id, value) => {
    collapseMap.value[id] = value
  }

  const switchCollapse = (id) => {
    collapseMap.value[id] = !collapseMap.value[id]
  }

  return { collapseMap, setCollapse, switchCollapse }
}

const { collapseMap, setCollapse, switchCollapse } = useCollapseMap()

/**
 * @typedef {Object} RowItem
 * @property {string} id
 * @property {string} label
 * @property {number} level level 为 0 表示顶层节点
 * @property {string} [parentId]
 * @property {RowItem} parent
 * @property {boolean} hasChildren
 * @property {boolean} collapsed
 * @property {any} rawData
 */

/**
 *
 * @param {Node} node
 * @param parentId
 * @param level
 * @param collapsed
 * @returns {RowItem[]}
 */
const flattenNode = (node, parentId, level = 0, collapsed = false) => {
  const { children, ...rest } = node

  const descendantNodes = (children || [])
    .map((child) => flattenNode(child, node.id, level + 1, collapsed || collapseMap.value[node.id]))
    .flat()

  const rowItem = {
    ...rest,
    parentId,
    level,
    hasChildren: children?.length > 0,
    collapsed
  }

  descendantNodes.forEach((node) => {
    if (!node.parent) {
      node.parent = rowItem
    }
  })

  return [rowItem].concat(descendantNodes)
}

/**
 *
 * @param {Node[]} nodes
 * @returns {RowItem[]}
 */
const flattenNodes = (nodes) => {
  const dummyNode = { children: nodes }
  return flattenNode(dummyNode, null, -1).slice(1)
}

const rows = computed(() => flattenNodes(normalizedData.value))

const emit = defineEmits(['click', 'mouseenter', 'drop'])

const handleClickRow = (row) => {
  emit('click', row)
}

const handleMouseEnterRow = (row) => {
  emit('mouseenter', row)
}

const useDraggingState = () => {
  /**
   * @type {{dragged?: RowItem, hovering?: RowItem, position: string, borderClass: string, forbidInsert: boolean}}
   */
  const initialState = { dragged: null, hovering: null, position: '', borderClass: '', forbidInsert: false }
  const draggingState = reactive({ ...initialState })
  const resetDraggingState = () => {
    Object.assign(draggingState, initialState)
  }
  return { draggingState, resetDraggingState }
}

const { draggingState, resetDraggingState } = useDraggingState()

const handleDragStart = (event, row) => {
  if (!props.draggable) {
    return
  }

  // 去掉ghost image
  event.dataTransfer.setDragImage(new Image(), 0, 0)

  draggingState.dragged = row

  // 收起有子节点的节点
  if (row.hasChildren) {
    setCollapse(row.id, true)
  }
}

const getPositionData = (event) => {
  const rect = event.currentTarget.getBoundingClientRect()
  const offsetY = event.clientY - rect.top

  // 判断鼠标的位置并设置边框样式
  const threshold = 8
  if (offsetY <= threshold) {
    // 顶部边框
    return { position: 'top', borderClass: 'border-top' }
  }

  if (offsetY >= rect.height - threshold) {
    // 底部边框
    return { position: 'bottom', borderClass: 'border-bottom' }
  }

  return { position: 'center', borderClass: 'border-all' }
}

const handleDragOver = (event, row) => {
  if (!props.draggable) {
    return
  }

  const data = getPositionData(event)

  // 无法将拖拽节点设置为根节点的兄弟节点
  if (row.id === rows.value[0].id && data.position !== 'center') {
    event.preventDefault()
    return
  }

  if (props.disallowDrop({ dragged: draggingState.dragged, target: row, position: data.position })) {
    Object.assign(draggingState, { ...data, hovering: row, forbidInsert: true })
    return
  }

  event.preventDefault()

  Object.assign(draggingState, { ...data, hovering: row, forbidInsert: false })
}

const handleDrop = () => {
  if (!props.draggable || draggingState.forbidInsert) {
    return
  }

  const { dragged, hovering, position } = draggingState

  emit('drop', { dragged, target: hovering, position })
}

const handleDragEnd = () => {
  resetDraggingState()
}

const handleDragLeaveContainer = (event) => {
  if (!props.draggable) {
    return
  }

  const rect = event.currentTarget.getBoundingClientRect()
  const threshold = 4
  // 如果拖拽时，拖拽到其他元素上，可能触发dragleave事件，所以再加个坐标判断
  if (
    event.clientX <= rect.left + threshold ||
    event.clientX >= rect.right - threshold ||
    event.clientY <= rect.top + threshold ||
    event.clientY >= rect.bottom - threshold
  ) {
    Object.assign(draggingState, { hovering: null })
  }
}
</script>

<style lang="less" scoped>
.draggable-tree {
  .tree-row {
    height: 24px;
    width: fit-content;
    min-width: 100%;
    padding: 0 8px;

    &,
    * {
      cursor: pointer;
    }
    &:hover,
    &.active {
      background-color: var(--te-common-bg-container);
    }
    &.dragging {
      background-color: var(--te-common-bg-info);
      &.forbid {
        background-color: var(--te-common-bg-error);
      }
    }

    & > * {
      flex-shrink: 0;
    }
  }
  .content {
    flex: 1;
    height: 100%;
  }

  .rotate {
    transform: rotate(-90deg);
  }
  .expand-icon {
    font-size: 16px;
    width: 16px;
    margin-right: 4px;
  }
  .slot-content {
    flex: 1;
    height: 100%;
    padding: 0 4px;
  }

  .border-top {
    box-shadow: inset 0 2px 0 0 var(--te-common-text-checked);
    &.forbid {
      box-shadow: inset 0 2px 0 0 var(--te-common-color-error);
    }
  }
  .border-bottom {
    box-shadow: inset 0 -2px 0 0 var(--te-common-text-checked);
    &.forbid {
      box-shadow: inset 0 -2px 0 0 var(--te-common-color-error);
    }
  }
  .border-all {
    outline: 1px solid var(--te-common-text-checked);
    outline-offset: -1px;
    &.forbid {
      outline: 1px solid var(--te-common-color-error);
    }
  }
}
svg {
  color: var(--te-common-icon-secondary);
  &:hover {
    color: var(--te-common-icon-hover);
  }
}
.flex-center {
  display: flex;
  align-items: center;
}
</style>
