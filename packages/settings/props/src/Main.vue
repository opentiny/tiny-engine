<template>
  <plugin-panel
    title="属性"
    :fixed-panels="fixedPanels"
    :fixed-name="PLUGIN_NAME.Props"
    :show-bottom-border="showEmptyTips"
    @close="$emit('close')"
  >
    <template #content>
      <config-render :data="properties">
        <template #prefix="{ data }">
          <block-link-field v-if="isBlock" :data="data"></block-link-field>
        </template>
      </config-render>
      <block-description v-if="isBlock" class="block-description"> </block-description>
      <empty :showEmptyTips="showEmptyTips"></empty>
    </template>
  </plugin-panel>
</template>

<script>
/* metaService: engine.setting.props.Main */
import { computed, watchEffect, ref, reactive, provide } from 'vue'
import { ConfigRender, BlockDescription, BlockLinkField, PluginPanel } from '@opentiny/tiny-engine-common'
import { useCanvas, useProperty, useLayout } from '@opentiny/tiny-engine-meta-register'
import Empty from './components/Empty.vue'

export default {
  components: {
    ConfigRender,
    BlockLinkField,
    BlockDescription,
    Empty,
    PluginPanel
  },
  props: {
    fixedPanels: {
      type: Array
    }
  },
  setup(props, { emit }) {
    const { pageState } = useCanvas()
    const { properties } = useProperty().getProperty({ pageState })
    const showEmptyTips = ref(false)

    const { PLUGIN_NAME } = useLayout()

    const panelState = reactive({
      emitEvent: emit
    })
    provide('panelState', panelState)

    const isBlock = computed(() => pageState.isBlock)

    watchEffect(() => {
      showEmptyTips.value = !properties.value?.length
    })

    return {
      PLUGIN_NAME,
      isBlock,
      properties,
      showEmptyTips
    }
  }
}
</script>

<style lang="less" scoped>
.block-description {
  margin: 12px;
}
</style>
