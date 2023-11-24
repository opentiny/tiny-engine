<template>
  <MetaArrayItem v-bind="$attrs" @update:modelValue="updateColumns"></MetaArrayItem>
</template>

<script setup>
import MetaArrayItem from './MetaArrayItem'
import { useProperties, useResource } from '@opentiny/tiny-engine-controller'

const { children: schemaChildren, componentName } = useProperties().getSchema()
const configureMap = useResource().getConfigureMap()
const childComponentName =
  configureMap[componentName]?.nestingRule?.childWhitelist?.[0] || schemaChildren?.[0]?.componentName

const updateColumns = (val) => {
  const children = val.map((item) => {
    return {
      componentName: childComponentName,
      props: { ...item }
    }
  })
  useProperties().getSchema().children = children
}
</script>
