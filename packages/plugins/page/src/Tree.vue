<template>
  <div class="draggable-tree">
    <div
      :class="['row', { active: active === node.id }]"
      v-for="(node, rowIndex) of filteredNodesWithAncestors"
      :key="node.id"
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
import { computed, defineEmits, defineProps } from 'vue'
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
    type: [String, Object],
    default: ''
  },
  rootId: {
    type: [String, Number],
    default: 'root'
  }
})

const emit = defineEmits(['clickRow'])

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

const filteredNodesWithAncestors = computed(() => {
  /** @type {Set<string>} */
  const idSet = new Set()

  const traverseToTop = (node) => {
    if (idSet.has(node.id)) {
      return
    }

    idSet.add(node.id)

    const parent = nodesMap.value[node.parentId]

    if (!parent) {
      return
    }

    traverseToTop(parent)
  }

  for (const node of filteredNodes.value) {
    traverseToTop(node)
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
</script>

<style lang="less" scoped>
.draggable-tree {
  .row {
    height: 24px;
    padding: 0 12px;
    margin: 0;
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
    .gap {
      width: 24px;
      height: 24px;
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
      background-color: var(--te-base-blue-20);
      color: var(--te-common-bg-primary-checked);
      svg {
        color: var(--te-common-bg-primary-checked);
      }
    }
  }
}
</style>
