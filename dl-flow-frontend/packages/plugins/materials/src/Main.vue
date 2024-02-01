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
            <network-list />
          </suspense>
        </tab-item>
        <tab-item name="layer" title="层">
          <layers />
        </tab-item>
      </Tabs>
    </template>
  </plugin-panel>
</template>

<script setup>
import { defineProps, toRefs, ref } from 'vue'
import { Tabs, TabItem } from '@opentiny/vue'
import { useLayout } from '@opentiny/tiny-engine-controller'
import { PluginPanel, SvgButton } from '@opentiny/tiny-engine-common'
import NetworkList from './networks/main.vue'
import Layers from './layer/main.vue'
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

:deep(.tiny-tabs__header),
.search {
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
