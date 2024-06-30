<template>
  <component :is="layout.entry" :registryData="registryData"></component>
</template>

<script>
import { getMergeRegistry } from '@opentiny/tiny-engine-entry'
import meta from '../meta'
export default {
  setup() {
    const registry = getMergeRegistry(meta.type, meta.id)
    const { layout, ...restRegistry } = registry
    return {
      registryData: restRegistry,
      layout
    }
  }
}
</script>
