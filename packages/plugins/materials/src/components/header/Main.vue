<template>
  <svg-button
    class="item icon-sidebar"
    :class="[fixedPanels?.includes(PLUGIN_NAME.Materials) && 'active']"
    name="fixed"
    :tips="!fixedPanels?.includes(PLUGIN_NAME.Materials) ? '固定面板' : '解除固定面板'"
    @click="$emit('fixPanel', PLUGIN_NAME.Materials)"
  ></svg-button>
</template>

<script>
import { SvgButton } from '@opentiny/tiny-engine-common'
import { useLayout } from '@opentiny/tiny-engine-meta-register'

export default {
  components: {
    SvgButton
  },

  props: {
    fixedPanels: {
      type: Array
    }
  },
  setup() {
    const { PLUGIN_NAME } = useLayout()

    return {
      PLUGIN_NAME
    }
  }
}
</script>
