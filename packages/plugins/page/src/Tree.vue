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
      v-show="!node.collapsed"
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
      <div class="content" @click="handleClickRow($event, node)">
        <layer-lines :line-data="layerLine[rowIndex]" :level="node.level"></layer-lines>
        <div class="prefix-icon" @click="handleSwitchCollapse(node)">
          <svg-icon v-if="node.rawData.isPage" :name="collapseMap[node.id] ? 'page-collection' : 'page'"></svg-icon>
          <svg-icon v-else :name="collapseMap[node.id] ? 'folder' : 'folder-wold'"></svg-icon>
        </div>
        <label>{{ node.label }}</label>
      </div>
      <slot name="row-suffix" :node="node"></slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
/* metaService: engine.plugins.appmanage.Tree */
import { computed, defineEmits, defineProps, ref, watch } from 'vue'
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

const useCollapseMap = () => {
  const collapseMap = ref<Record<string, boolean>>({})

  const setCollapse = (id: string | number, value: boolean) => {
    collapseMap.value[id] = value
  }

  const switchCollapse = (id: string | number) => {
    collapseMap.value[id] = !collapseMap.value[id]
  }

  return { collapseMap, setCollapse, switchCollapse }
}

const { collapseMap, setCollapse, switchCollapse } = useCollapseMap()

export interface TreeNode {
  id: string | number
  label: string
  parentId?: string | number
  level: number
  collapsed?: boolean
  rawData?: any
}

const handleSwitchCollapse = (node: TreeNode) => {
  const children = node.rawData[props.childrenKey]
  if (Array.isArray(children) && children.length > 0) {
    switchCollapse(node.id)
  }
}

const flattenTreeData = (node: any, parentId?: string | number, level = 0, collapsed = false): TreeNode[] => {
  const { idKey, labelKey, childrenKey } = props

  const currentNode = {
    id: node[idKey],
    label: node[labelKey],
    parentId,
    level,
    collapsed,
    rawData: node
  }
  const result: TreeNode[] = [currentNode]

  const children = node[childrenKey]

  if (Array.isArray(children)) {
    for (const child of children) {
      result.push(...flattenTreeData(child, currentNode.id, level + 1, collapsed || collapseMap.value[currentNode.id]))
    }
  }

  return result
}

const nodes = computed(() => {
  return flattenTreeData({ [props.idKey]: props.rootId, [props.childrenKey]: props.data }).slice(1)
})

const nodesMap = computed<Record<string | number, TreeNode>>(() => {
  return nodes.value.reduce((result, node) => {
    result[node.id] = node
    return result
  }, {} as Record<string | number, TreeNode>)
})

const getAncestorIds = (nodeId: string | number): (string | number)[] => {
  const currentNode = nodesMap.value[nodeId]

  if (!currentNode || !currentNode.parentId) {
    return []
  }

  const ancestors = getAncestorIds(currentNode.parentId)

  ancestors.push(currentNode.parentId)

  return ancestors
}

const filteredNodes = ref<TreeNode[]>([])

// 下面两个 watch 对应的两个重新计算 filteredNodes 的场景。场景2比场景1多了展开匹配到的节点的操作

// 场景1. 页面树的结构发生变化，或者有节点收起或者展开，重新计算 filteredNodes
watch(nodes, (nodes) => {
  filteredNodes.value = nodes.filter((node) => node.label.toLowerCase().includes(props.filterValue.toLowerCase()))
})

// 场景2. 过滤条件发生变化，重新计算 filteredNodes，并且展开匹配到的节点
watch(
  () => props.filterValue,
  (filterValue) => {
    const filtered = nodes.value.filter((node) => node.label.toLowerCase().includes(filterValue.toLowerCase()))

    let collapseMapChanged = false
    if (filterValue) {
      filtered.forEach((node) => {
        // 每个节点的祖先节点中，如果存在折叠的节点，则展开
        for (const id of getAncestorIds(node.id)) {
          if (collapseMap.value[id]) {
            setCollapse(id, false)
            collapseMapChanged = true
          }
        }
      })
    }

    // - 如果 collapseMap 有变化，会自动重新计算 nodes，更新路径：
    //   props.filterValue -> collapseMap -> nodes -> filteredNodes -> filteredNodesWithAncestors
    // - 如果 collapseMap 没有变化，则重新设置 filteredNodes，更新路径：
    //   props.filterValue -> filteredNodes -> filteredNodesWithAncestors
    if (!collapseMapChanged) {
      filteredNodes.value = filtered
    }
  }
)

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
  const result: Record<number, Record<number, number>> = {}

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

const handleClickRow = (event: MouseEvent, node: TreeNode) => {
  // 点击事件来自折叠图标，不触发 clickRow 事件。点击事件仍然可以冒泡
  const currentTarget = event.currentTarget as HTMLElement
  if (currentTarget.querySelector('div.prefix-icon')?.contains(event.target as Node)) {
    return
  }

  emit('clickRow', node)
}

const draggedNode = ref<TreeNode | null>(null)
const hoveringNodeId = ref<string | number | null>(null)

const handleDragStart = (_event: DragEvent, node: TreeNode) => {
  if (!props.draggable) {
    return
  }

  draggedNode.value = node
}

// dragover和dragenter事件回调函数都为handleDragOver。跨行拖动时，禁止拖拽图标可能会闪一下，所以将dragenter事件也加上回调函数
const handleDragOver = (event: DragEvent, node: TreeNode) => {
  if (!props.draggable) {
    return
  }

  const isDescendant = getAncestorIds(node.id).includes(draggedNode.value!.id)

  if (!isDescendant) {
    // 阻止默认行为以允许放置
    event.preventDefault()
    hoveringNodeId.value = node.id
  } else {
    hoveringNodeId.value = null
  }
}

const handleDrop = (event: DragEvent, node: Pick<TreeNode, 'id'>) => {
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

const handleContainerDragOver = (event: DragEvent) => {
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

const handleContainerDragLeave = (event: DragEvent) => {
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
  overflow-x: auto;
  .row {
    width: fit-content;
    min-width: 100%;
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
      background-color: var(--te-page-manage-draggable-row-bg-color-hover);
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
    }
    .prefix-icon {
      display: flex;
      align-items: center;
      margin-right: 8px;
      svg {
        color: var(--te-page-manage-draggable-icon-color);
      }
    }
    &.active {
      background-color: var(--te-page-manage-draggable-row-bg-color-hover);
      color: var(--te-page-manage-draggable-text-color);
      svg {
        color: var(--te-page-manage-draggable-icon-color);
      }
    }
  }
}
.border-transparent {
  border: 1px solid transparent;
}
.hover-border-color {
  border-color: var(--te-page-manage-draggable-border-color);
  overflow: hidden;
}
</style>
