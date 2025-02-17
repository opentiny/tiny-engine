<template>
  <plugin-panel title="资源管理" class="bridge-manage" :isCloseLeft="false" @close="closePanel">
    <template #header>
      <svg-button name="add-utils" placement="left" :tips="tips" @click="addResource('npm')"></svg-button>
    </template>
    <template #content>
      <bridge-manage ref="utilsRef" :name="RESOURCE_TYPE.Util" @open="openBridgePanel"></bridge-manage>
      <bridge-setting @refresh="refreshList"></bridge-setting>
    </template>
  </plugin-panel>
</template>

<script>
import { ref, computed } from 'vue'
import { PluginPanel, SvgButton } from '@opentiny/tiny-engine-common'
import { RESOURCE_TYPE } from './js/resource'
import BridgeManage from './BridgeManage.vue'
import BridgeSetting, { openPanel, closePanel } from './BridgeSetting.vue'
import { RESOURCE_TIP } from './js/resource'

export default {
  components: {
    PluginPanel,
    SvgButton,
    BridgeManage,
    BridgeSetting
  },
  setup() {
    const activedName = ref(RESOURCE_TYPE.Util)
    const utilsRef = ref(null)
    const tips = computed(() => RESOURCE_TIP[activedName.value])

    const openBridgePanel = () => {
      openPanel()
    }

    const refreshList = (type) => {
      type == utilsRef.value.refresh(type)
    }

    const addResource = (type) => {
      activedName.value == utilsRef.value.add(type)
    }

    return {
      addResource,
      RESOURCE_TYPE,
      activedName,
      openBridgePanel,
      closePanel,
      refreshList,
      utilsRef,
      tips
    }
  }
}
</script>

<style lang="less" scoped>
:deep(.tiny-button) {
  border-radius: 4px;
  height: 24px;
  line-height: 24px;
}
</style>
