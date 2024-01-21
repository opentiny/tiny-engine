<template>
  <plugin-panel title="物料" @close="$emit('close')">
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
      <Tabs v-model="activeName" tab-style="button-card" class="full-width-tabs">
        <tab-item name="nn" title="网络">
          <suspense>
            <layer-list />
          </suspense>
        </tab-item>
        <tab-item name="backbone" title="Backbone">
          <span>backbone</span>
        </tab-item>
      </Tabs>
    </template>
    <!-- <template #header>
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
    </template> -->
  </plugin-panel>
</template>

<script setup>
import { defineProps, toRefs, ref } from 'vue'
import { Tabs, TabItem } from '@opentiny/vue'
import { useLayout } from '@opentiny/tiny-engine-controller'
import { PluginPanel, SvgButton } from '@opentiny/tiny-engine-common'
import LayerList from './nn/main.vue'
const props = defineProps({
  fixedPanels: {
    type: Array
  }
})
const { fixedPanels } = toRefs(props)
const { PLUGIN_NAME } = useLayout()
const activeName = ref('nn')
</script>

<script>
export const api = {}
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
