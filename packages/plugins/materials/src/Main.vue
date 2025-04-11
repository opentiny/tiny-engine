<template>
  <component :is="layout.entry" :registryData="registryData" class="plugin-materials"></component>
</template>

<script lang="ts">
/* metaService */
import { getMergeMeta } from '@opentiny/tiny-engine-meta-register'
import meta from '../meta'
export default {
  setup() {
    const registry = getMergeMeta(meta.id)
    const { layout, ...restRegistry } = registry
    return {
      registryData: restRegistry,
      layout
    }
  }
}
</script>
