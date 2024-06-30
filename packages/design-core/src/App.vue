<template>
  <component :is="registry.layout.component" :registry="registry"></component>
</template>

<script>
import { getMergeRegistry } from '@opentiny/tiny-engine-meta-register'

export default {
  setup() {
    const registry = getMergeRegistry()
    return {
      registry
    }
  }
}
</script>
