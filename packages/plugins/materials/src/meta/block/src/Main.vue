<template>
  <block-panel v-if="existBlockModule" v-bind="$attrs"></block-panel>
</template>

<script>
import { getMergeMeta } from '@opentiny/tiny-engine-meta-register'
import BlockPanel from './BlockPanel.vue'

export default {
  components: {
    BlockPanel
  },
  props: {},
  setup() {
    const existBlockModule = getMergeMeta('engine.plugins.blockmanage')

    return {
      existBlockModule
    }
  }
}
</script>

<style lang="less" scoped></style>
