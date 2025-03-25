<template>
  <plugin-panel
    title="资源管理"
    class="plugin-bridge"
    :fixed-name="PLUGIN_NAME.Bridge"
    :fixedPanels="fixedPanels"
    @close="closePanel"
  >
    <template #header>
      <svg-button name="add-utils" placement="left" :tips="tips" @click="addResource('npm')"></svg-button>
    </template>
    <template #content>
      <bridge-manage ref="utilsRef" :name="RESOURCE_TYPE.Util" @open="openBridgePanel"></bridge-manage>
      <bridge-setting @refresh="refreshList"></bridge-setting>
    </template>
  </plugin-panel>
</template>

<script lang="ts">
import { ref, reactive, computed, provide } from 'vue'
import { PluginPanel, SvgButton } from '@opentiny/tiny-engine-common'
import { useLayout } from '@opentiny/tiny-engine-meta-register'
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
  props: {
    fixedPanels: {
      type: Array
    }
  },
  setup(props, { emit }) {
    const activedName = ref(RESOURCE_TYPE.Util)
    const utilsRef = ref(null)
    const tips = computed(() => RESOURCE_TIP[activedName.value])

    const { PLUGIN_NAME } = useLayout()

    const panelState = reactive({
      emitEvent: emit
    })
    provide('panelState', panelState)

    const openBridgePanel = () => {
      openPanel()
    }

    const refreshList = (type) => {
      utilsRef.value.refresh(type)
    }

    const addResource = (type) => {
      utilsRef.value.add(type)
    }

    return {
      PLUGIN_NAME,
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
