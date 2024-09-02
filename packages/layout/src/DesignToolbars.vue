<template>
  <div class="tiny-engine-toolbar">
    <div class="toolbar-left">
      <component :is="item.entry" v-for="item in leftBar" :key="item.id"></component>
    </div>
    <div class="toolbar-center">
      <component :is="item.entry" v-for="item in centerBar" :key="item.id"></component>
    </div>
    <div class="toolbar-right">
      <component :is="item.entry" v-for="item in rightBar" :key="item.id"></component>
      <toolbar-collapse :collapseBar="collapseBar"></toolbar-collapse>
    </div>
  </div>
  <div class="progress">
    <progress-bar v-if="state.showDeployBlock"></progress-bar>
  </div>
</template>

<script>
import { reactive, nextTick } from 'vue'
import { ProgressBar } from '@opentiny/tiny-engine-common'
import ToolbarCollapse from './ToolbarCollapse.vue'

export default {
  components: {
    ProgressBar,
    ToolbarCollapse
  },
  props: {
    toolbars: {
      type: Array,
      default: () => []
    }
  },
  setup(props) {
    const leftBar = []
    const rightBar = []
    const centerBar = []
    const collapseBar = []
    const state = reactive({
      showDeployBlock: false
    })

    props.toolbars.forEach((item) => {
      if (item.align === 'right') {
        item?.collapsed ? collapseBar.push(item) : rightBar.push(item)
      } else if (item.align === 'center') {
        centerBar.push(item)
      } else {
        leftBar.push(item)
      }
    })
    nextTick(() => {
      state.showDeployBlock = true
    })

    return {
      leftBar,
      rightBar,
      centerBar,
      state,
      collapseBar
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

  .toolbar-left,
  .toolbar-right {
    :deep(.icon) {
      display: inline-flex;
      justify-content: center;
      align-items: center;
      vertical-align: middle;
      width: 26px;
      height: 26px;
      border-radius: 4px;
      position: relative;
      margin-right: 4px;
      svg {
        cursor: pointer;
        font-size: 20px;
        color: var(--ti-lowcode-toolbar-title-color);
      }
    }
  }

  .toolbar-left {
    margin: 0 1px;
    :deep(.icon) {
      background: var(--ti-lowcode-toolbar-view-active-bg);
      svg {
        font-size: 16px;
      }
      &:not(.disabled):hover {
        background: var(--ti-lowcode-toolbar-left-icon-bg-hover);
      }
    }
  }

  .toolbar-right {
    margin: 0 6px;
    margin-right: 24px;
    align-items: center;
    :deep(.icon) {
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
    .toolbar-right-content {
      display: flex;
      .toolbar-right-item {
        display: flex;
        justify-content: center;
        align-items: center;
        margin: 0 2px;
        .toolbar-right-item-comp {
          margin-right: 6px;
        }
      }
    }

    .toolbar-right-line {
      color: var(--ti-lowcode-toolbar-right-line);
      margin: 0 6px;
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
.toolbar-right-content .toolbar-right-item:last-child {
  .toolbar-right-line {
    display: none;
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
