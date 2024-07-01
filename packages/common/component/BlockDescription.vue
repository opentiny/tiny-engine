<template>
  <meta-description class="description" type="warning">
    <template #content>
      <div @click="openBlockSetting" class="setting-block"><span class="add-icon">+</span>设置区块暴露属性</div>
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
  border-color: var(--ti-lowcode-description-color);

  .setting-block {
    cursor: pointer;
  }
  .add-icon {
    padding: 0 3px;
    margin: 0 5px;
    color: var(--ti-lowcode-toolbar-icon-color);
    border-radius: 50%;
    background-color: var(--ti-lowcode-description-color);
  }
}
</style>
