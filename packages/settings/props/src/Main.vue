<template>
  <!-- 固定面板按钮组件 -->
  <plugin-panel title="属性" @close="$emit('close')">
    <!-- header插槽加入了一个固定面板按钮 -->
    <template #header>
      <svg-button
        class="item icon-sidebar"
        :class="[fixedPanels?.includes(SETTING_NAME.Props) && 'active']"
        name="fixed"
        :tips="!fixedPanels?.includes(SETTING_NAME.Props) ? '固定面板' : '解除固定面板'"
        @click="$emit('fixPanel', SETTING_NAME.Props)"
      ></svg-button>
    </template>
    <!-- 下面content插槽渲染的则是面板的具体内容 -->
    <template #content>
      <div class="scroll-content">
        <!-- 在属性面板渲染设置的属性的入口 -->
        <config-render :data="properties">
          <template #prefix="{ data }">
            <block-link-field v-if="isBlock" :data="data"></block-link-field>
          </template>
        </config-render>
        <block-description v-if="isBlock" class="block-description"> </block-description>
        <empty :showEmptyTips="showEmptyTips"></empty>
      </div>
    </template>
  </plugin-panel>
</template>

<!-- props界面 -->
<script>
import { computed, watchEffect, ref } from 'vue'
import { ConfigRender, BlockDescription, BlockLinkField } from '@opentiny/tiny-engine-common'
import { useCanvas, useProperty } from '@opentiny/tiny-engine-controller'
import Empty from './components/Empty.vue'
import { PluginPanel, SvgButton } from '@opentiny/tiny-engine-common'
import { useLayout } from '@opentiny/tiny-engine-controller'

export default {
  components: {
    ConfigRender,
    BlockLinkField,
    BlockDescription,
    Empty,
    PluginPanel,
    SvgButton
  },
  props: {
    fixedPanels: {
      type: Array
    }
  },
  setup(props, { emit }) {
    const { SETTING_NAME } = useLayout()
    const { pageState } = useCanvas()
    // 选中之后，经过 getProps 的计算，我们会得到 properties，渲染在属性面板
    const { properties } = useProperty({ pageState })
    const showEmptyTips = ref(false)

    const isBlock = computed(() => pageState.isBlock)

    watchEffect(() => {
      showEmptyTips.value = !properties.value?.length
    })

    return {
      SETTING_NAME,
      isBlock,
      properties,
      showEmptyTips
    }
  }
}
</script>

<style lang="less" scoped>
.block-description {
  margin: 10px;
}
</style>
