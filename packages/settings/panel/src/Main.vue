<template>
  <div id="tiny-right-panel">
    <tiny-tabs :model-value="modelValue" @update:model-value="updateModelValue" tab-style="button-card">
      <tiny-tab-item v-for="(setting, index) in settings" :key="index" :title="setting.title" :name="setting.name">
        <component :is="setting.component"></component>
        <div v-show="activated" class="active"></div>
      </tiny-tab-item>
    </tiny-tabs>
  </div>
</template>

<script>
import { getMergeMeta } from '@opentiny/tiny-engine-meta-register'
import { TabItem, Tabs } from '@opentiny/vue'

export default {
  components: {
    TinyTabs: Tabs,
    TinyTabItem: TabItem
  },
  props: {
    modelValue: String,
    activated: String
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const settings = getMergeMeta('engine.settings')?.metas || []

    const updateModelValue = (value) => {
      emit('update:modelValue', value)
    }

    return {
      settings,
      updateModelValue
    }
  }
}
</script>

<style lang="less" scoped>
#tiny-right-panel {
  width: var(--base-right-panel-width);
  height: 100%;
  transition: 0.3s linear;
  position: relative;
  border-left: 1px solid var(--te-settings-panel-border-color);
  padding-top: 20px;
  background-color: var(--te-settings-panel-common-bg-color);

  .tiny-tabs {
    height: 100%;
  }
  :deep(.tiny-tabs) {
    display: flex;
    flex-direction: column;
    // 居中显示
    .tiny-tabs__nav-scroll {
      text-align: center;
      .tiny-tabs__nav {
        display: inline-flex;
        justify-content: center;
        float: none;
      }
    }
    .tiny-tabs__header {
      padding-bottom: 12px;
    }
    .tiny-tabs__content {
      flex: 1;
      overflow-y: scroll;
      padding: 0;
      margin: 0;
    }
    .tiny-tabs__item {
      color: var(--te-settings-panel-common-text-color-secondary);
      &:hover {
        color: var(--te-settings-panel-common-text-color-primary);
      }
      &.is-active {
        color: var(--te-settings-panel-common-text-color-primary);
      }
    }
  }

  :deep(.tiny-collapse-item__content) {
    padding: 8px 16px;
  }
}

.active {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  animation: glow 800ms ease-out infinite alternate;
  transition: opacity 1s linear;
}

@keyframes glow {
  0% {
    box-shadow: inset 0px 0px 4px var(--te-settings-panel-bg-color-active);
  }
  100% {
    box-shadow: inset 0px 0px 14px var(--te-settings-panel-bg-color-active);
  }
}
</style>
