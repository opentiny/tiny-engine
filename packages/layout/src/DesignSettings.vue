<template>
  <div id="tiny-right-panel">
    <tiny-tabs v-model="layoutState.settings.render">
      <tiny-tab-item v-for="(setting, index) in settings" :key="index" :title="setting.title" :name="setting.name">
        <component :is="setting.entry"></component>
        <div v-show="activating" class="active"></div>
      </tiny-tab-item>
    </tiny-tabs>
  </div>
</template>

<script>
import { computed, ref } from 'vue'
import { Tabs, TabItem } from '@opentiny/vue'
import { useLayout } from '@opentiny/tiny-engine-meta-register'

export default {
  components: {
    TinyTabs: Tabs,
    TinyTabItem: TabItem
  },
  props: {
    settings: {
      type: Array,
      default: () => []
    }
  },
  setup() {
    const { layoutState } = useLayout()
    const activating = computed(() => layoutState.settings.activating)
    const showMask = ref(true)

    return {
      showMask,
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
  padding-top: 12px;
  background-color: var(--ti-lowcode-setting-panel-bg-color);

  .tiny-tabs {
    height: 100%;
  }
  :deep(.tiny-tabs) {
    display: flex;
    flex-direction: column;
    .tiny-tabs__nav-scroll {
      margin-left: 12px;
      .tiny-tabs__active-bar {
        height: 3px;
        background-color: var(--ti-lowcode-setting-panel-tabs-item-title-active-color);
      }
    }

    .tiny-tabs__content {
      flex: 1;
      overflow-y: auto;
      padding: 0;
      margin: 0;
    }
    .tiny-tabs__item {
      flex: 1;
      background-color: var(--ti-lowcode-setting-panel-bg-color);
      color: var(--ti-lowcode-setting-panel-tabs-item-title-color);
      &:hover {
        color: var(--ti-lowcode-setting-panel-tabs-item-title-hover-color);
      }
      &.is-active {
        color: var(--ti-lowcode-setting-panel-tabs-item-title-active-color);
      }

      .tiny-tabs__item__title {
        padding-bottom: 2px;
      }
    }

    .tiny-tabs__nav-wrap-not-separator::after {
      z-index: 2;
    }
  }

  :deep(.tiny-collapse-item__content) {
    padding: 0 8px 12px 12px; // 这里的bottom为4px + 内部行元素与底部的距离为8px = 12px
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
