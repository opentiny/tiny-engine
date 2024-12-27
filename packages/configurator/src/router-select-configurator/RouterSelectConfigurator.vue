<template>
  <tiny-select v-model="state.selected" :is-drop-inherit-width="true" :clearable="true" @change="handleChange">
    <tiny-option
      v-for="item in options"
      :key="item.value"
      :label="item.label"
      :value="item.value"
      :disabled="item.disabled"
    >
    </tiny-option>
  </tiny-select>
</template>

<script setup>
import { usePage } from '@opentiny/tiny-engine-meta-register'
import { Option as TinyOption, Select as TinySelect } from '@opentiny/vue'
import { computed, defineEmits, defineProps, reactive, watchEffect } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Array],
    default: () => ''
  }
})

const emit = defineEmits(['update:modelValue'])

const state = reactive({
  selected: props.modelValue?.name ?? ''
})

watchEffect(() => {
  state.selected = props.modelValue?.name ?? ''
})

const { pageSettingState, getPageList, STATIC_PAGE_GROUP_ID } = usePage()

const pages = computed(() => pageSettingState.pages[STATIC_PAGE_GROUP_ID].data)

if (!Array.isArray(pages.value)) {
  getPageList()
}

const flattenTreeData = (node, parentId, level = 0) => {
  const currentNode = {
    id: node.id,
    label: node.name,
    parentId,
    level,
    rawData: node
  }
  const result = [currentNode]

  const children = node.children

  if (Array.isArray(children)) {
    for (const child of children) {
      result.push(...flattenTreeData(child, currentNode.id, level + 1))
    }
  }

  return result
}

const options = computed(() => {
  return flattenTreeData({ id: '', children: pages.value })
    .slice(1)
    .filter((node) => node.rawData.isPage)
    .map((node) => ({ label: node.label, value: node.id }))
})

const handleChange = () => {
  emit('update:modelValue', { name: state.selected })
}
</script>
