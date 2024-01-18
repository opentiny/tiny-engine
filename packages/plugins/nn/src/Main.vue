<template>
  <plugin-panel :title="shortcut ? '' : '物料'" @close="$emit('close')">
    <template #header>
      <svg-button
        class="item icon-sidebar"
        :class="[fixedPanels?.includes(PLUGIN_NAME.Materials) && 'active']"
        name="fixed"
        :tips="!fixedPanels?.includes(PLUGIN_NAME.Materials) ? '固定面板' : '解除固定面板'"
        @click="$emit('fixPanel', PLUGIN_NAME.Materials)"
      ></svg-button>
    </template>
    <template #content>
      <tiny-tabs v-model="activeName" tab-style="button-card" class="full-width-tabs" @click="tabClick">
        <tiny-tab-item name="components" title="网络">
          <component-panel></component-panel>
        </tiny-tab-item>
      </tiny-tabs>
    </template>
  </plugin-panel>
</template>

<script>
import { ref, reactive, provide } from 'vue'
import { Tabs, TabItem } from '@opentiny/vue'
import { PluginPanel, SvgButton } from '@opentiny/tiny-engine-common'
import ComponentPanel from './component/Main.vue'
import { useLayout } from '@opentiny/tiny-engine-controller'

export const api = {}

export default {
  components: {
    TinyTabs: Tabs,
    TinyTabItem: TabItem,
    PluginPanel,
    ComponentPanel,
    SvgButton
  },

  props: {
    shortcut: [Boolean, String],
    fixedPanels: {
      type: Array
    }
  },
  emits: ['close', 'fix-panel'],
  setup(props, { emit }) {
    const activeName = ref('components')

    const panelState = reactive({
      isShortcutPanel: props.shortcut,
      isBlockGroupPanel: false,
      isBlockList: false,
      emitEvent: emit
    })

    provide('panelState', panelState)
    const { PLUGIN_NAME } = useLayout()

    return {
      activeName,
      PLUGIN_NAME
    }
  }
}
</script>

<style lang="less" scoped>
.tiny-tabs {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
}

:deep(.tiny-tabs__header) {
  padding: 8px;
}

:deep(.tiny-tabs__content) {
  flex: 1;
  overflow-y: scroll;
  padding: 0;
  & > div {
    height: 100%;
  }
}

.tiny-collapse {
  flex: 1;
  overflow-y: scroll;
}
</style>
