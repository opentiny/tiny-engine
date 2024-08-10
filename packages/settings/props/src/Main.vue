<template>
  <plugin-panel title="属性" :fixed-panels="fixedPanels" :fixed-name="PLUGIN_NAME.Props" @close="$emit('close')">
    <template #content>
      <div>
        <config-render :data="properties">
          <template #prefix="{ data }">
            <block-link-field v-if="isBlock" :data="data"></block-link-field>
          </template>
        </config-render>
        <block-description v-if="isBlock" class="block-description"> </block-description>
        <empty :showEmptyTips="showEmptyTips"></empty>
      </div>
    </template>
  </plugin-panel>
</template>

<!-- props界面 -->
<script>
import { computed, watchEffect, ref, reactive, provide } from 'vue'
import { ConfigRender, BlockDescription, BlockLinkField } from '@opentiny/tiny-engine-common'
import { useCanvas, useProperty } from '@opentiny/tiny-engine-controller'
import Empty from './components/Empty.vue'
import { PluginPanel } from '@opentiny/tiny-engine-common'
import { useLayout } from '@opentiny/tiny-engine-controller'

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
  emits: ['close', 'fix-panel'],
  setup(props, { emit }) {
    const { PLUGIN_NAME } = useLayout()
    const { pageState } = useCanvas()

    const panelState = reactive({
      emitEvent: emit
    })
    provide('panelState', panelState)

    // 选中之后，经过 getProps 的计算，我们会得到 properties，渲染在属性面板
    const { properties } = useProperty({ pageState })
    const showEmptyTips = ref(false)

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
  margin: 10px;
}
</style>
