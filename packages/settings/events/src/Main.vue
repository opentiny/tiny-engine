<template>
  <plugin-panel title="高级" :fixed-panels="fixedPanels" :fixed-name="PLUGIN_NAME.Event" @close="$emit('close')">
    <template #content>
      <tiny-collapse v-model="activeNames">
        <tiny-collapse-item title="事件绑定" name="bindEvent">
          <bind-events></bind-events>
        </tiny-collapse-item>
        <tiny-collapse-item title="高级配置" name="advancedConfig">
          <advance-config></advance-config>
        </tiny-collapse-item>
      </tiny-collapse>
    </template>
  </plugin-panel>
</template>

<!-- event插件界面 -->
<script>
import { ref, reactive, provide } from 'vue'
import { Collapse as TinyCollapse, CollapseItem as TinyCollapseItem } from '@opentiny/vue'
import BindEvents from './components/BindEvents.vue'
import AdvanceConfig from './components/AdvanceConfig.vue'
import { PluginPanel } from '@opentiny/tiny-engine-common'
import { useLayout } from '@opentiny/tiny-engine-controller'
export default {
  components: {
    PluginPanel,
    BindEvents,
    AdvanceConfig,
    TinyCollapse,
    TinyCollapseItem
  },
  props: {
    fixedPanels: {
      type: Array
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    const { PLUGIN_NAME } = useLayout()
    const activeNames = ref(['bindEvent', 'advancedConfig'])

    const panelState = reactive({
      emitEvent: emit
    })
    provide('panelState', panelState)

    return {
      PLUGIN_NAME,
      activeNames
    }
  }
}
</script>
