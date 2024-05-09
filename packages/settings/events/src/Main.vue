<template>
  <tiny-collapse v-model="activeNames">
    <tiny-collapse-item title="事件绑定" name="bindEvent">
      <bind-events></bind-events>
    </tiny-collapse-item>
    <tiny-collapse-item title="高级配置" name="advancedConfig">
      <advance-config></advance-config>
    </tiny-collapse-item>
  </tiny-collapse>
</template>

<script setup>
import { ref } from 'vue'
import { Collapse as TinyCollapse, CollapseItem as TinyCollapseItem } from '@opentiny/vue'
import BindEvents from './components/BindEvents.vue'
import AdvanceConfig from './components/AdvanceConfig.vue'

const activeNames = ref(['bindEvent', 'advancedConfig'])
</script>
