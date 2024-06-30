<template>
  <div class="plugin-panel">
    <div class="plugin-panel-header">
      <div class="plugin-panel-title">
        <span class="title">{{ title }}</span>
        <close-icon v-if="isCloseLeft" :name="name" @close="closePanel"></close-icon>
      </div>
      <div class="plugin-panel-icon">
        <slot name="header"></slot>
        <close-icon v-if="!isCloseLeft" :name="name" @close="closePanel"></close-icon>
      </div>
    </div>
    <slot name="content"></slot>
  </div>
</template>

<script>
import { useLayout } from '@opentiny/tiny-engine-meta-register'
import CloseIcon from './CloseIcon.vue'

export default {
  components: {
    CloseIcon
  },
  props: {
    /**
     * plugin面板标题
     */
    title: {
      type: String,
      default: ''
    },
    /**
     * 关闭图标是否在左侧
     */
    isCloseLeft: {
      type: Boolean,
      default: false
    },
    name: {
      type: String,
      default: 'cross'
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    const closePanel = () => {
      useLayout().closePlugin()

      emit('close')
    }

    return {
      closePanel
    }
  }
}
</script>

<style lang="less" scoped>
.plugin-panel {
  width: 100%;
  height: 100%;
  background: var(--ti-lowcode-plugin-panel-bg, --ti-lowcode-toolbar-bg);
  display: flex;
  flex-direction: column;
  position: relative;

  .plugin-panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    line-height: 48px;
    font-size: 14px;
    font-weight: var(--ti-lowcode-plugin-panel-title-font-weight);
    font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans',
      'Helvetica Neue', sans-serif;
    padding: 0 12px;
    color: var(--ti-lowcode-plugin-panel-title-color);
    font-weight: var(--ti-lowcode-plugin-panel-title-font-weight);
    border-bottom: 1px solid var(--ti-lowcode-plugin-panel-header-border-bottom-color);
    margin-bottom: 16px;
    .plugin-panel-title {
      display: flex;
      align-items: center;
      .title + .icon-wrap {
        margin-left: 10px;
      }
    }

    .plugin-panel-icon {
      display: grid;
      grid-auto-flow: column;
      align-items: center;

      :deep(.svg-button + .svg-button) {
        margin: 0;
      }
    }
  }
}
</style>
