<template>
  <!-- 固定面板按钮组件 -->
  <plugin-panel title="高级" @close="$emit('close')">
    <!-- header插槽加入了一个固定面板按钮 -->
    <template #header>
      <svg-button
        class="item icon-sidebar"
        :class="[fixedPanels?.includes(SETTING_NAME.Event) && 'active']"
        name="fixed"
        :tips="!fixedPanels?.includes(SETTING_NAME.Event) ? '固定面板' : '解除固定面板'"
        @click="$emit('fixPanel', SETTING_NAME.Event)"
      ></svg-button>
    </template>
    <!-- 下面content插槽渲染的则是面板的具体内容 -->
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
import { ref } from 'vue'
import { Collapse as TinyCollapse, CollapseItem as TinyCollapseItem } from '@opentiny/vue'
import BindEvents from './components/BindEvents.vue'
import AdvanceConfig from './components/AdvanceConfig.vue'
import { PluginPanel, SvgButton } from '@opentiny/tiny-engine-common'
import { useLayout } from '@opentiny/tiny-engine-controller'
export default {
  components: {
    PluginPanel,
    SvgButton,
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
    const { SETTING_NAME } = useLayout()
    const activeNames = ref(['bindEvent', 'advancedConfig'])

    return {
      SETTING_NAME,
      activeNames
    }
  }
}
</script>
