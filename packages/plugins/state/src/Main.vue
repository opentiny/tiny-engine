<template>
  <component :is="layout.component" :registry="registry"></component>
</template>

<script>
import { getMergeRegistry } from '@opentiny/tiny-engine-entry'
import meta from '../meta'

export default {
  setup() {
    const registry = getMergeRegistry(meta.type, meta.id)
    const { layout, apis, ...restRegistry } = registry

    return {
      registry: restRegistry,
      layout
    }
  }
}
</script>
