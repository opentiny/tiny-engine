<template>
  <component :is="layout.entry" :registryData="registryData" class="plugin-materials"></component>
</template>

<script>
import { getMergeRegistry } from '@opentiny/tiny-engine-meta-register'
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
