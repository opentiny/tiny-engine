<template>
  <div class="draggable-tree">
    <div
      v-for="row in rows"
      :key="row.id"
      class="tree-row flex-center"
      :draggable="draggable ? 'true' : undefined"
      @mouseenter="handleMouseEnterRow(row)"
      @dragover="handleDragOver($event, row)"
      @dragenter="handleDragOver($event, row)"
    >
      <span v-for="n in row.level" :key="n" class="gap"></span>
      <div class="content flex-center">
        <span v-if="!row.hasChildren" class="expand-icon"></span>
        <svg-icon
          v-if="row.hasChildren"
          name="dropdown"
          :class="['expand-icon', { rotate: collapseMap[row.id] }]"
          @click="switchCollapse(row.id)"
        ></svg-icon>
        <slot name="content">
          <div class="slot-content flex-center">
            <label>{{ row.label }}</label>
            <svg-icon name="eye"></svg-icon>
          </div>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, defineEmits, defineProps, ref } from 'vue'

const props = defineProps({
  data: {
    type: Array,
    default: () => []
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
  const switchCollapse = (id) => {
    collapseMap.value[id] = !collapseMap.value[id]
  }

  return [collapseMap, switchCollapse]
}

const [collapseMap, switchCollapse] = useCollapseMap()

/**
 * @typedef {Object} ListItem
 * @property {string} id
 * @property {string} label
 * @property {number} level level 为 0 表示顶层节点
 * @property {string} [parentId]
 * @property {boolean} hasChildren
 * @property {any} rawData
 */

/**
 *
 * @param {Node} node
 * @param {string} [parentId]
 * @param {number} level
 * @returns {ListItem[]}
 */
const flatternNode = (node, parentId, level = 0) => {
  const { children, ...rest } = node

  const childNodes =
    !collapseMap.value[node.id] && Array.isArray(children)
      ? children
          .map((child) => flatternNode(child, node.id, level + 1))
          .reduce((acc, current) => acc.concat(current), [])
      : []

  const listItem = { ...rest, parentId, level, hasChildren: children?.length > 0 }

  return [listItem].concat(childNodes)
}

/**
 *
 * @param {Node[]} nodes
 * @returns {ListItem[]}
 */
const flatternNodes = (nodes) => {
  const dummyNode = { children: nodes }
  return flatternNode(dummyNode, null, -1).slice(1)
}

const rows = computed(() => flatternNodes(normalizedData.value))

const emit = defineEmits(['mouseEnterItem'])

const handleMouseEnterRow = (row) => {
  emit('mouseEnterItem', row.id)
}

const handleDragOver = (event) => {
  if (!props.draggable) {
    return
  }

  event.preventDefault()
}
</script>

<style lang="less" scoped>
.draggable-tree {
  .tree-row {
    height: 24px;
    padding: 0 6px;
    &,
    * {
      cursor: pointer;
    }
    &:hover {
      background-color: var(--te-common-bg-container);
      // border: 1px solid; // TODO
    }
  }
  .gap {
    width: 8px;
  }
  .content {
    flex: 1;
    height: 100%;
    padding: 0 6px;
    &:hover {
      // border: 1px solid; // TODO
    }
  }

  .rotate {
    transform: rotate(-90deg);
  }
  .expand-icon {
    font-size: 16px;
    width: 16px;
    margin-right: 8px;
  }
  .slot-content {
    flex: 1;
    height: 100%;
    label {
      flex: 1;
      font-size: 12px;
      line-height: 20px;
    }
  }

  svg.icon-eye {
    display: none;
  }
  .tree-row:hover svg.icon-eye {
    display: unset;
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
