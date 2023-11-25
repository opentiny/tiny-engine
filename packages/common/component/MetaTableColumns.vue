<template>
  <MetaArrayItem v-bind="$attrs" @update:modelValue="updateColumns"></MetaArrayItem>
</template>

<script setup>
import { defineProps, computed } from 'vue'
import MetaArrayItem from './MetaArrayItem'
import { useProperties, useResource } from '@opentiny/tiny-engine-controller'

const props = defineProps({
  meta: {
    type: Object,
    default: () => {}
  }
})

const { children: schemaChildren, componentName } = useProperties().getSchema()
const defaultValue = computed(() => props.meta.defaultValue || [])
const configureMap = useResource().getConfigureMap()
const childComponentName =
  configureMap[componentName]?.nestingRule?.childWhitelist?.[0] || schemaChildren?.[0]?.componentName

const updateColumns = (columns) => {
  const children = columns.map((item) => {
    return {
      componentName: childComponentName,
      props: { ...item }
    }
  })
  useProperties().getSchema().children = children
}

updateColumns(defaultValue.value)
</script>
