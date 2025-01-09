<template>
  <div class="tiny-engine-toolbar">
    <div class="toolbar-left">
      <component
        :is="getMergeMeta(comp).entry"
        v-for="comp in state.leftBar"
        :key="comp"
        :options="getMergeMeta(comp).options"
      ></component>
    </div>
    <div class="toolbar-center">
      <component
        :is="getMergeMeta(comp).entry"
        v-for="comp in state.centerBar"
        :key="comp"
        :options="getMergeMeta(comp).options"
      ></component>
    </div>
    <div class="toolbar-right">
      <div class="toolbar-right-content">
        <div class="toolbar-right-item" v-for="(item, idx) in state.rightBar" :key="idx">
          <div v-if="typeof item === 'string'">
            <component :is="getMergeMeta(item)?.entry" :options="getMergeMeta(item)?.options"></component>
          </div>
          <div class="toolbar-right-item-arr" v-if="Array.isArray(item)">
            <div class="toolbar-right-item-comp" v-for="comp in item" :key="comp">
              <component :is="getMergeMeta(comp)?.entry" :options="getMergeMeta(comp)?.options"></component>
            </div>
            <span class="toolbar-right-line" v-if="layoutRegistry.options?.isShowLine">|</span>
          </div>
        </div>
      </div>
      <toolbar-collapse
        :collapseBar="state.collapseBar"
        v-if="layoutRegistry.options?.isShowCollapse"
      ></toolbar-collapse>
    </div>
  </div>
</template>

<script>
import { reactive } from 'vue'
import { getMergeMeta } from '@opentiny/tiny-engine-meta-register'
import ToolbarCollapse from './ToolbarCollapse.vue'

export default {
  components: {
    ToolbarCollapse
  },
  props: {
    layoutRegistry: {
      type: Object,
      default: () => {}
    }
  },
  setup(props) {
    const state = reactive({
      leftBar: props.layoutRegistry?.options?.toolbars?.left,
      rightBar: props.layoutRegistry?.options?.toolbars?.right,
      centerBar: props.layoutRegistry?.options?.toolbars?.center,
      collapseBar: props.layoutRegistry?.options?.toolbars?.collapse
    })

    return {
      getMergeMeta,
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

  .toolbar-left,
  .toolbar-center,
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
    margin-right: 12px;
    align-items: center;
    :deep(.icon) {
      margin-right: 0;
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
    .toolbar-right-main {
      display: flex;
    }
    .toolbar-right-content {
      display: flex;
      .toolbar-right-item-arr,
      .toolbar-right-item {
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .toolbar-right-item {
        margin: 0 2px;
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
