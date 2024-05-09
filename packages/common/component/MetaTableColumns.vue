<template>
  <MetaArrayItem v-bind="$attrs" @update:modelValue="updateColumns"></MetaArrayItem>
</template>

<script setup>
import { nextTick } from 'vue'
import { updateRect } from '@opentiny/tiny-engine-canvas'
import { useProperties, useResource } from '@opentiny/tiny-engine-controller'
import MetaArrayItem from './MetaArrayItem.vue'

const { children: schemaChildren, componentName, props } = useProperties().getSchema()
const configureMap = useResource().getConfigureMap()
const childComponentName =
  configureMap[componentName]?.nestingRule?.childWhitelist?.[0] || schemaChildren?.[0]?.componentName

const updateColumns = (columns) => {
  if (!columns?.length) {
    return
  }

  const children = columns.map((item) => {
    return {
      componentName: childComponentName,
      props: { ...item }
    }
  })

  useProperties().getSchema().children = children
  nextTick(updateRect)
}

updateColumns(props?.columns)
</script>
