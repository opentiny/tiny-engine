<template>
  <component :is="registry.layout.component" :registry="registry"></component>
</template>

<script>
import { getMergeRegistry } from '@opentiny/tiny-engine-entry'

export default {
  setup() {
    const registry = getMergeRegistry()
    return {
      registry
    }
  }
}
</script>
