<template>
  <component :is="layout.component" :metaData="metaData"></component>
</template>

<script>
import { getMergeRegistry } from '@opentiny/tiny-engine-entry'
import meta from '../meta'
export default {
  setup() {
    const registry = getMergeRegistry(meta.type, meta.id)
    const { layout, ...restRegistry } = registry
    return {
      metaData: restRegistry,
      layout
    }
  }
}
</script>
