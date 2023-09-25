<template>
  <plugin-panel title="资源管理" :isCloseLeft="false" @close="closePanel">
    <template #header>
      <svg-button name="add-utils" placement="left" :tips="tips" @click="addResource('npm')"></svg-button>
    </template>
    <template #content>
      <tiny-tabs v-model="activedName" class="tabs full-width-tabs" tab-style="button-card" @click="switchTab">
        <tiny-tab-item :name="RESOURCE_TYPE.Util" title="工具类">
          <bridge-manage ref="utils" :name="RESOURCE_TYPE.Util" @open="openBridgePanel"></bridge-manage>
        </tiny-tab-item>
        <tiny-tab-item v-if="isVsCodeEnv" :name="RESOURCE_TYPE.Bridge" title="桥接源">
          <bridge-manage ref="bridge" :name="RESOURCE_TYPE.Bridge" @open="openBridgePanel"></bridge-manage>
        </tiny-tab-item>
      </tiny-tabs>
      <bridge-setting @refresh="refreshList"></bridge-setting>
    </template>
  </plugin-panel>
</template>

<script>
import { ref, computed } from 'vue'
import { Tabs, TabItem } from '@opentiny/vue'
import { PluginPanel, SvgButton } from '@opentiny/tiny-engine-common'
import { isVsCodeEnv } from '@opentiny/tiny-engine-common/js/environments'
import { RESOURCE_TYPE } from './js/resource'
import BridgeManage from './BridgeManage.vue'
import BridgeSetting, { openPanel, closePanel } from './BridgeSetting.vue'
import { setType, RESOURCE_TIP } from './js/resource'

export default {
  components: {
    TinyTabs: Tabs,
    TinyTabItem: TabItem,
    PluginPanel,
    SvgButton,
    BridgeManage,
    BridgeSetting
  },
  setup() {
    const activedName = ref(RESOURCE_TYPE.Util)
    const bridge = ref(null)
    const utils = ref(null)
    const tips = computed(() => RESOURCE_TIP[activedName.value])

    const switchTab = (tab) => {
      closePanel()
      setType(tab.name)
    }

    const openUtilPanel = () => {
      closePanel()
    }

    const openBridgePanel = () => {
      openPanel()
    }

    const refreshList = (type) => {
      type === RESOURCE_TYPE.Util ? utils.value.refresh(type) : bridge.value.refresh(type)
    }

    const addResource = (type) => {
      activedName.value === RESOURCE_TYPE.Util ? utils.value.add(type) : bridge.value.add(type)
    }

    return {
      addResource,
      RESOURCE_TYPE,
      activedName,
      switchTab,
      openBridgePanel,
      closePanel,
      openUtilPanel,
      refreshList,
      bridge,
      utils,
      tips,
      isVsCodeEnv
    }
  }
}
</script>

<style lang="less" scoped>
.tabs {
  height: calc(100% - 46px);
}

:deep(.tiny-tabs__header) {
  padding: 8px;
  border-bottom: 1px solid var(--ti-lowcode-tabs-border-color);
}

:deep(.tiny-tabs__content) {
  height: calc(100% - 45px);
  padding: 0;
  & > div {
    height: 100%;
  }
}
</style>
