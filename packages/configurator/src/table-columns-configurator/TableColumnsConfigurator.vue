<template>
  <ArrayItemConfigurator v-bind="$attrs" @update:modelValue="updateColumns"></ArrayItemConfigurator>
</template>

<script setup>
import { useProperties, useMaterial, useCanvas } from '@opentiny/tiny-engine-meta-register'
import ArrayItemConfigurator from '../array-item-configurator/ArrayItemConfigurator.vue'

const { children: schemaChildren, componentName, props } = useProperties().getSchema()
const configureMap = useMaterial().getConfigureMap()
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

  useCanvas().operateNode({ type: 'updateAttributes', id: useProperties().getSchema().id, value: { children } })
}

updateColumns(props?.columns)
</script>
