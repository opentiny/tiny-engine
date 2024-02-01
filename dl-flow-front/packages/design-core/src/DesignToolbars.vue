<template>
  <div class="tiny-engine-toolbar">
    <div class="toolbar-left">
      <component :is="item.component" v-for="item in leftBar" :key="item.id"></component>
    </div>
    <div class="toolbar-center">
      <component :is="item.component" v-for="item in centerBar" :key="item.id"></component>
    </div>
    <div class="toolbar-right">
      <component :is="item.component" v-for="item in rightBar" :key="item.id"></component>
    </div>
  </div>
  <div class="progress">
    <progress-bar v-if="state.showDeployBlock"></progress-bar>
  </div>
</template>

<script>
import { reactive, nextTick } from 'vue'
import addons from '@opentiny/tiny-engine-app-addons'
import { useLayout } from '@opentiny/tiny-engine-controller'
import { ProgressBar } from '@opentiny/tiny-engine-common'
export default {
  components: {
    ProgressBar
  },
  setup() {
    const leftBar = []
    const rightBar = []
    const centerBar = []
    const state = reactive({
      showDeployBlock: false
    })

    addons.toolbars.forEach((item) => {
      if (item.align === 'right') {
        rightBar.push(item)
      } else if (item.align === 'center') {
        centerBar.push(item)
      } else {
        leftBar.push(item)
      }
      if (item.id === 'lock') {
        useLayout().registerPluginApi({ Lock: item.api })
      }
      if (item.id === 'save') {
        useLayout().registerPluginApi({ save: item.api })
      }
    })
    nextTick(() => {
      state.showDeployBlock = true
    })

    return {
      leftBar,
      rightBar,
      centerBar,
      state
    }
  }
}
</script>

<style lang="less" scoped>
.tiny-engine-toolbar {
  user-select: none;
  display: flex;
  flex-shrink: 0;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: var(--base-top-panel-height);
  text-align: center;
  background-color: var(--ti-lowcode-common-layout-bg);
  position: relative;
  z-index: 1001;
  border-bottom: 1px solid var(--ti-lowcode-toolbar-border-bottom-color);

  .toolbar-left,
  .toolbar-center,
  .toolbar-right {
    height: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .toolbar-left {
    margin: 0 1px;
  }

  .toolbar-right {
    margin: 0 6px;
    margin-right: 24px;
    column-gap: 6px;
    align-items: center;
    :deep(.icon) {
      display: inline-flex;
      justify-content: center;
      align-items: center;
      vertical-align: middle;
      width: 32px;
      height: 32px;
      border-radius: 6px;
      position: relative;
      svg {
        cursor: pointer;
        font-size: 20px;
        color: var(--ti-lowcode-toolbar-title-color);
      }
      &:not(.disabled):hover {
        background: var(--ti-lowcode-toolbar-view-active-bg);
      }
      &.active {
        color: var(--ti-lowcode-common-primary-color);
      }
      &.disabled {
        cursor: not-allowed;
      }
    }
    .tiny-locales {
      height: 35px;
      padding: 5px 12px;
      font-size: 12px;
      display: inline-flex;
      justify-content: center;
      align-items: center;
      :deep(span) {
        color: var(--ti-lowcode-toolbar-icon-color);
        opacity: 0.4;
      }

      &:hover {
        :deep(span) {
          opacity: 0.8;
        }
      }
    }
  }
}

@media only screen and (max-width: 1280px) {
  .tiny-engine-toolbar {
    .toolbar-center {
      flex: 1;
      justify-content: center;
    }

    :deep(.top-panel-breadcrumb) {
      width: auto;
    }
  }
}
.progress {
  position: absolute;
  top: var(--base-top-panel-height);
  left: 0;
  width: 100%;
  z-index: 1002;
  :deep(.tiny-progress-bar__innerText) {
    display: none;
  }
}
</style>
