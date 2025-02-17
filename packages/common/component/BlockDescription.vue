<template>
  <meta-description class="description">
    <template #content>
      <div class="setting-block" @click="openBlockSetting">
        <svg-icon name="block-add-prop"></svg-icon>
        <span>设置区块暴露属性</span>
      </div>
    </template>
  </meta-description>
</template>

<script>
import { useLayout, useBlock } from '@opentiny/tiny-engine-meta-register'
import MetaDescription from './MetaDescription.vue'

export default {
  components: {
    MetaDescription
  },
  setup() {
    const { getCurrentBlock } = useBlock()
    const { PLUGIN_NAME, activePlugin } = useLayout()

    const openBlockSetting = () => {
      activePlugin(PLUGIN_NAME.BlockManage).then((api) => {
        api.openSettingPanel({ item: getCurrentBlock() })
      })
    }

    return {
      openBlockSetting
    }
  }
}
</script>

<style lang="less" scoped>
.description {
  font-size: 12px;

  &.wrapper {
    height: 32px;
    padding: 0 12px;
    border-left: 0;
    box-shadow: none;
    border-radius: 4px;
    display: flex;
    align-items: center;
    background-color: var(--te-component-block-bg-color);
  }

  .setting-block {
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    .svg-icon {
      color: var(--te-component-common-block-add-text-color);
    }
  }

  .svg-icon {
    font-size: 16px;
  }
}
</style>
