<template>
  <div
    :class="['draggable-tree', 'border-transparent', { 'hover-border-color': hoveringNodeId === rootId }]"
    @dragover="handleContainerDragOver"
    @dragenter="handleContainerDragOver"
    @dragleave="handleContainerDragLeave"
    @drop="handleDrop($event, { id: rootId })"
  >
    <div
      v-for="(node, rowIndex) of filteredNodesWithAncestors"
      :class="[
        'row',
        'border-transparent',
        {
          active: String(active) === String(node.id),
          ['hover-border-color']: hoveringNodeId === node.id
        }
      ]"
      :key="node.id"
      :draggable="draggable ? 'true' : undefined"
      @dragstart="handleDragStart($event, node)"
      @dragover="handleDragOver($event, node)"
      @dragenter="handleDragOver($event, node)"
      @drop="handleDrop($event, node)"
      @dragend="handleDragEnd"
    >
      <div class="content" @click="handleClickRow(node)">
        <layer-lines :line-data="layerLine[rowIndex]" :level="node.level"></layer-lines>
        <div class="prefix-icon">
          <svg-icon v-if="node.rawData.isPage" name="text-page-common"></svg-icon>
          <svg-icon v-else name="text-page-folder-closed"></svg-icon>
        </div>
        <label>{{ node.label }}</label>
      </div>
      <slot name="row-suffix" :node="node"></slot>
    </div>
  </div>
</template>

<script setup>
import { computed, defineEmits, defineProps, ref } from 'vue'
import LayerLines from './LayerLines.vue'

const props = defineProps({
  data: {
    type: Object,
    required: true
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
  active: {
    type: String
  },
  filterValue: {
    type: String,
    default: ''
  },
  rootId: {
    type: [String, Number],
    default: 'root'
  },
  draggable: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['clickRow', 'moveNode'])

const flattenTreeData = (node, parentId, level = 0) => {
  const { idKey, labelKey, childrenKey } = props

  const currentNode = {
    id: node[idKey],
    label: node[labelKey],
    parentId,
    level,
    rawData: node
  }
  const result = [currentNode]

  const children = node[childrenKey]

  if (Array.isArray(children)) {
    for (const child of children) {
      result.push(...flattenTreeData(child, currentNode.id, level + 1))
    }
  }

  return result
}

const nodes = computed(() => {
  return flattenTreeData({ [props.idKey]: props.rootId, [props.childrenKey]: props.data }).slice(1)
})

const nodesMap = computed(() => {
  return nodes.value.reduce((result, node) => {
    result[node.id] = node
    return result
  }, {})
})

const filteredNodes = computed(() => {
  return nodes.value.filter((node) => node.label.toLowerCase().includes(props.filterValue))
})

const getAncestorIds = (nodeId) => {
  const currentNode = nodesMap.value[nodeId]

  if (!currentNode || !currentNode.parentId) {
    return []
  }

  const ancestors = getAncestorIds(currentNode.parentId)

  ancestors.push(currentNode.parentId)

  return ancestors
}

const filteredNodesWithAncestors = computed(() => {
  const idSet = new Set()

  for (const node of filteredNodes.value) {
    idSet.add(node.id)
    for (const id of getAncestorIds(node.id)) {
      idSet.add(id)
    }
  }

  return nodes.value.filter((node) => idSet.has(node.id))
})

const lines = {
  node: 0b01, // └
  layer: 0b10, // │
  layerNode: 0b11 // ├
}

const layerLine = computed(() => {
  const result = {}

  const nodes = filteredNodesWithAncestors.value

  for (const [index, node] of nodes.entries()) {
    result[index] = result[index] || {}
    result[index][node.level - 1] = lines.node

    if (node.parentId !== props.rootId) {
      const parentIndex = nodes.findIndex((item) => item.id === node.parentId)
      for (let i = parentIndex + 1; i < index; i++) {
        result[i][node.level - 1] = (result[i][node.level - 1] || 0) | lines.layer
      }
    }
  }

  return result
})

const handleClickRow = (node) => {
  emit('clickRow', node)
}

const draggedNode = ref(null)
const hoveringNodeId = ref(null)

const handleDragStart = (event, node) => {
  if (!props.draggable) {
    return
  }

  draggedNode.value = node
}

// dragover和dragenter事件回调函数都为handleDragOver。跨行拖动时，禁止拖拽图标可能会闪一下，所以将dragenter事件也加上回调函数
const handleDragOver = (event, node) => {
  if (!props.draggable) {
    return
  }

  const isDescendant = getAncestorIds(node.id).includes(draggedNode.value.id)

  if (!isDescendant) {
    // 阻止默认行为以允许放置
    event.preventDefault()
    hoveringNodeId.value = node.id
  } else {
    hoveringNodeId.value = null
  }
}

const handleDrop = (event, node) => {
  event.preventDefault()

  const dragged = draggedNode.value
  draggedNode.value = null

  if (!dragged) {
    return
  }

  const isDescendant = getAncestorIds(node.id).includes(dragged.id)

  if (!isDescendant && dragged.id !== node.id && dragged.parentId !== node.id) {
    emit('moveNode', dragged, node)
  }
}

const handleDragEnd = () => {
  hoveringNodeId.value = null
}

const handleContainerDragOver = (event) => {
  if (!props.draggable) {
    return
  }

  if (event.target !== event.currentTarget) {
    return
  }
  event.preventDefault()
  // 拖拽到根节点
  hoveringNodeId.value = props.rootId
}

const handleContainerDragLeave = (event) => {
  if (!props.draggable) {
    return
  }

  if (event.target !== event.currentTarget) {
    return
  }
  // drag时光标超出了drag zone，清除悬停框
  hoveringNodeId.value = null
}
</script>

<style lang="less" scoped>
.draggable-tree {
  padding: 6px 0;
  .row {
    height: 24px;
    padding: 0 12px;
    margin: 0 -1px;
    display: flex;
    align-items: center;
    &,
    * {
      cursor: pointer;
    }
    &:hover {
      background-color: var(--te-common-bg-container);
    }

    .content {
      flex: 1;
      display: flex;
      align-items: center;
      overflow: hidden;
    }
    label {
      flex: 1;
      font-size: 12px;
      line-height: 18px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .prefix-icon {
      display: flex;
      align-items: center;
      margin-right: 8px;
      svg {
        color: var(--te-common-icon-secondary);
      }
    }
    &.active {
      background-color: var(--te-common-bg-container);
      color: var(--te-common-text-primary);
      svg {
        color: var(--te-common-icon-secondary);
      }
    }
  }
}
.border-transparent {
  border: 1px solid transparent;
}
.hover-border-color {
  border-color: var(--te-common-border-checked);
  overflow: hidden;
}
</style>
