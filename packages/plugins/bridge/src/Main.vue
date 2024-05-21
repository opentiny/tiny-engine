<template>
  <plugin-panel title="资源管理" :isCloseLeft="false" @close="closePanel">
    <template #header>
      <link-button :href="docsUrl"></link-button>
      <svg-button name="add-utils" placement="left" :tips="tips" @click="addResource('npm')"></svg-button>
    </template>
    <template #content>
      <tiny-tabs v-model="activedName" class="tabs full-width-tabs" tab-style="button-card" @click="switchTab">
        <tiny-tab-item :name="RESOURCE_TYPE.Util" title="工具类">
          <bridge-manage ref="utilsRef" :name="RESOURCE_TYPE.Util" @open="openBridgePanel"></bridge-manage>
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
import { PluginPanel, SvgButton, LinkButton } from '@opentiny/tiny-engine-common'
import { useHelp } from '@opentiny/tiny-engine-controller'
import { isVsCodeEnv } from '@opentiny/tiny-engine-controller/js/environments'
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
    BridgeSetting,
    LinkButton
  },
  setup() {
    const activedName = ref(RESOURCE_TYPE.Util)
    const bridge = ref(null)
    const utilsRef = ref(null)
    const tips = computed(() => RESOURCE_TIP[activedName.value])
    const docsUrl = useHelp().getDocsUrl('bridge')

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
      type === RESOURCE_TYPE.Util ? utilsRef.value.refresh(type) : bridge.value.refresh(type)
    }

    const addResource = (type) => {
      activedName.value === RESOURCE_TYPE.Util ? utilsRef.value.add(type) : bridge.value.add(type)
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
      docsUrl,
      utilsRef,
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
:deep(.help-box) {
  position: absolute;
  left: 72px;
  top: 3px;
}
</style>
