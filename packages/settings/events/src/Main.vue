<template>
  <plugin-panel
    title="高级"
    :fixed-panels="fixedPanels"
    :fixed-name="PLUGIN_NAME.Event"
    :header-margin-bottom="0"
    @close="$emit('close')"
  >
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

<script setup>
/* metaService: engine.setting.event.Main */
import { ref, reactive, provide, defineProps, defineEmits } from 'vue'
import { Collapse as TinyCollapse, CollapseItem as TinyCollapseItem } from '@opentiny/vue'
import BindEvents from './components/BindEvents.vue'
import AdvanceConfig from './components/AdvanceConfig.vue'
import { PluginPanel } from '@opentiny/tiny-engine-common'
import { useLayout } from '@opentiny/tiny-engine-meta-register'

const activeNames = ref(['bindEvent', 'advancedConfig'])
const { PLUGIN_NAME } = useLayout()

defineProps({
  fixedPanels: Array
})

const emit = defineEmits([])

const panelState = reactive({
  emitEvent: emit
})

provide('panelState', panelState)
</script>
