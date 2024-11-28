<template>
  <svg-button
    class="item icon-sidebar"
    :name="panelFixed ? 'fixed-solid' : 'fixed'"
    :tips="panelFixed ? '解除固定面板' : '固定面板'"
    @click="$emit('fix-panel', PLUGIN_NAME.Materials)"
  ></svg-button>
</template>

<script>
import { computed } from 'vue'
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
  setup(props) {
    const { PLUGIN_NAME } = useLayout()
    const panelFixed = computed(() => props.fixedPanels?.includes(PLUGIN_NAME.Materials))

    return {
      PLUGIN_NAME,
      panelFixed
    }
  }
}
</script>
