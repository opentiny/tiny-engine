<template>
  <ArrayItemConfigurator v-bind="$attrs" @update:modelValue="updateColumns"></ArrayItemConfigurator>
</template>

<script setup>
import { nextTick } from 'vue'
import { useProperties, useResource, useCanvas } from '@opentiny/tiny-engine-controller'
import ArrayItemConfigurator from '../array-item-configurator/ArrayItemConfigurator.vue'

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
  nextTick(useCanvas().canvasApi.value.updateRect)
}

updateColumns(props?.columns)
</script>
