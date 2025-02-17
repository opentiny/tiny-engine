<template>
  <div id="tiny-right-panel">
    <tiny-tabs v-model="layoutState.settings.render">
      <tiny-tab-item v-for="(setting, index) in settings" :key="index" :title="setting.title" :name="setting.name">
        <component :is="setting.entry"></component>
        <div v-show="activating" class="active"></div>
      </tiny-tab-item>
    </tiny-tabs>
    <div v-if="layoutState.settings.render === 'style'" class="tabs-setting">
      <tiny-tooltip effect="light" :content="isCollapsed ? '展开' : '折叠'" placement="top" :visible-arrow="false">
        <template #default> <svg-icon :name="settingIcon" @click="isCollapsed = !isCollapsed"></svg-icon> </template>
      </tiny-tooltip>
    </div>
  </div>
</template>

<script>
import { computed, provide, ref } from 'vue'
import { Tabs, TabItem, Tooltip } from '@opentiny/vue'
import { useLayout } from '@opentiny/tiny-engine-meta-register'

export default {
  components: {
    TinyTabs: Tabs,
    TinyTabItem: TabItem,
    TinyTooltip: Tooltip
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
    const isCollapsed = ref(false)
    const settingIcon = computed(() => (isCollapsed.value ? 'collapse_all' : 'expand_all'))

    provide('isCollapsed', isCollapsed)

    return {
      showMask,
      isCollapsed,
      activating,
      settingIcon,
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
  border-left: 1px solid var(--te-layout-common-border-color);
  padding-top: 12px;
  background-color: var(--te-layout-common-bg-color);

  .tabs-setting {
    position: absolute;
    top: 9px;
    right: 18px;
    line-height: 26px;
    color: var(--te-layout-common-icon-color);
    cursor: pointer;
  }
  .tiny-tabs {
    height: 100%;
  }
  :deep(.tiny-tabs) {
    display: flex;
    flex-direction: column;
    .tiny-tabs__header .tiny-tabs__nav {
      width: 60%;
      background-color: var(--te-layout-common-bg-color);
    }
    .tiny-tabs__nav-scroll {
      margin-left: 12px;
      .tiny-tabs__active-bar {
        height: 3px;
        background-color: var(--te-layout-common-text-color-active);
      }
    }

    .tiny-tabs__content {
      flex: 1;
      overflow-y: auto;
      padding: 0;
      margin: 0;
    }
    .tiny-tabs__nav.is-show-active-bar .tiny-tabs__item {
      margin-right: 8px;
    }
    .tiny-tabs__item {
      flex: 1;
      background-color: var(--te-layout-common-bg-color);
      color: var(--te-layout-common-text-color-secondary);
      margin-right: 5px;
      &:hover {
        color: var(--te-layout-common-text-color-hover);
      }
      &.is-active {
        color: var(--te-layout-common-text-color-active);
        border: none;
      }

      .tiny-tabs__item__title {
        padding-bottom: 6px;
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
    box-shadow: inset 0px 0px 4px var(--te-layout-setting-bg-color-hover);
  }
  100% {
    box-shadow: inset 0px 0px 14px var(--te-layout-setting-bg-color-hover);
  }
}
</style>
