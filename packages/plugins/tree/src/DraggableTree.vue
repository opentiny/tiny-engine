<template>
  <div class="draggable-tree"></div>
</template>

<script setup>
import { computed, defineProps, watch } from 'vue'

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

/**
 * @typedef {Object} ListItem
 * @property {string} id
 * @property {string} label
 * @property {number} level level 为 0 表示顶层节点
 * @property {string} [parentId]
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

  const childNodes = (children || [])
    .map((child) => flatternNode(child, node.id, level + 1))
    .reduce((acc, current) => acc.concat(current), [])

  const listItem = { ...rest, parentId, level }

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

const listItems = computed(() => flatternNodes(normalizedData.value))

watch(
  listItems,
  (value) => {
    // eslint-disable-next-line no-console
    console.log(value)
  },
  {
    immediate: true
  }
)
</script>

<style lang="less" scoped>
.draggable-tree {
}
</style>
