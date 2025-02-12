<template>
  <div class="plugin-panel">
    <div class="plugin-panel-header">
      <div class="plugin-panel-title">
        <span class="title"
          >{{ title }}<link-button class="link" v-if="isShowDocsIcon" :href="docsUrl"></link-button
        ></span>
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
import LinkButton from './LinkButton.vue'
import CloseIcon from './CloseIcon.vue'

export default {
  components: {
    LinkButton,
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
    },
    docsUrl: {
      type: String,
      default: ''
    },
    isShowDocsIcon: {
      type: Boolean,
      default: false
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
  background: var(--te-common-bg-default);
  display: flex;
  flex-direction: column;
  position: relative;

  .plugin-panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    font-weight: var(--ti-lowcode-plugin-panel-title-font-weight);
    font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans',
      'Helvetica Neue', sans-serif;
    padding: 12px;
    color: var(--ti-lowcode-plugin-panel-title-color);
    font-weight: var(--ti-lowcode-plugin-panel-title-font-weight);
    .plugin-panel-title {
      display: flex;
      align-items: center;
      .title + .icon-wrap {
        margin-left: 10px;
      }
      .title {
        display: flex;
        align-items: center;
        margin-right: 5px;
      }
    }

    .plugin-panel-icon {
      display: grid;
      grid-auto-flow: column;
      align-items: center;

      :deep(.svg-button + .svg-button) {
        margin-left: 4px;
      }
      :deep(.svg-button + .icon-wrap) {
        margin-left: 4px;
      }
    }
  }
}
</style>
