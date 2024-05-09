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
        <tiny-tab-item name="components" title="组件">
          <component-panel></component-panel>
        </tiny-tab-item>
        <tiny-tab-item name="blocks" title="区块">
          <block-panel></block-panel>
        </tiny-tab-item>
      </tiny-tabs>
      <block-group-panel></block-group-panel>
      <block-version-select></block-version-select>
    </template>
  </plugin-panel>
</template>

<script>
import { ref, reactive, provide } from 'vue'
import { Tabs, TabItem } from '@opentiny/vue'
import { PluginPanel, SvgButton } from '@opentiny/tiny-engine-common'
import ComponentPanel from './component/Main.vue'
import BlockPanel from './block/Main.vue'
import BlockGroupPanel from './block/BlockGroupPanel.vue'
import BlockVersionSelect from './block/BlockVersionSelect.vue'
import { setBlockPanelVisible, setBlockVersionPanelVisible } from './block/js/usePanel'
import { useLayout } from '@opentiny/tiny-engine-controller'
import { fetchGroups } from './block/http'

export const api = {
  fetchGroups
}

export default {
  components: {
    TinyTabs: Tabs,
    TinyTabItem: TabItem,
    PluginPanel,
    ComponentPanel,
    BlockPanel,
    BlockGroupPanel,
    BlockVersionSelect,
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

    const tabClick = (tabs) => {
      if (tabs.name === 'components') {
        setBlockPanelVisible(false)
        setBlockVersionPanelVisible(false)
      }
    }
    const { PLUGIN_NAME } = useLayout()

    return {
      activeName,
      tabClick,
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
