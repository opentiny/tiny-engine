<template>
  <div id="tiny-right-panel">
    <tiny-tabs v-model="layoutState.settings.render" tab-style="button-card">
      <tiny-tab-item v-for="(setting, index) in settings" :key="index" :title="setting.title" :name="setting.name">
        <component :is="setting.component"></component>
        <div v-show="activating" class="active"></div>
      </tiny-tab-item>
    </tiny-tabs>
  </div>
</template>

<script>
import { computed, ref } from 'vue'
import { Tabs, TabItem } from '@opentiny/vue'
import { useLayout } from '@opentiny/tiny-engine-controller'
import addons from '@opentiny/tiny-engine-app-addons'

export default {
  components: {
    TinyTabs: Tabs,
    TinyTabItem: TabItem
  },

  setup() {
    const { layoutState } = useLayout()
    const settings = addons && addons.settings
    const activating = computed(() => layoutState.settings.activating)
    const showMask = ref(true)

    return {
      showMask,
      settings,
      activating,
      layoutState
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
  border-left: 1px solid var(--ti-lowcode-plugin-setting-panel-border-left-color);
  padding-top: 20px;
  background-color: var(--ti-lowcode-setting-panel-bg-color);

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
      margin-top: 0;
    }
    .tiny-tabs__item {
      color: var(--ti-lowcode-setting-panel-tabs-item-title-color);
      &:hover {
        color: var(--ti-lowcode-setting-panel-tabs-item-title-hover-color);
      }
      &.is-active {
        color: var(--ti-lowcode-setting-panel-tabs-item-title-active-color);
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
    box-shadow: inset 0px 0px 4px var(--ti-lowcode-canvas-handle-hover-bg);
  }
  100% {
    box-shadow: inset 0px 0px 14px var(--ti-lowcode-canvas-handle-hover-bg);
  }
}
</style>
