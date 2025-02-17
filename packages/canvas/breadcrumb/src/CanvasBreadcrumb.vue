<template>
  <div id="tiny-bottom-panel">
    <div class="content">
      <tiny-steps v-show="data.length > 0" :data="data" @click="(_index, node) => selectFooterNode(node)"></tiny-steps>
      <div v-show="data.length <= 0" class="tip">没有选中的节点</div>
    </div>
  </div>
</template>

<script>
import { getMetaApi } from '@opentiny/tiny-engine-meta-register'
import { Steps } from '@opentiny/vue'

export default {
  components: {
    TinySteps: Steps
  },
  props: {
    data: {
      type: Array,
      default: () => []
    }
  },
  emits: ['click'],
  setup() {
    const { selectNode } = getMetaApi('engine.canvas').canvasApi.value
    const selectFooterNode = ({ node }) => {
      selectNode(node)
    }
    return {
      selectFooterNode
    }
  }
}
</script>

<style lang="less" scoped>
#tiny-bottom-panel {
  width: 100%;
  height: var(--base-bottom-panel-height, 30px);
  bottom: 0;
  position: absolute;
  background-color: var(--te-canvas-breadcrumb-bg-color);
  z-index: 90;
  border-top: 1px solid var(--te-canvas-breadcrumb-border-color);
  .content {
    .tip {
      color: var(--te-canvas-breadcrumb-text-color);
      line-height: 30px;
      height: 30px;
      padding-left: 10px;
    }
    :deep(.tiny-steps-advanced) {
      li {
        width: unset !important;
        background: var(--te-canvas-breadcrumb-bg-color);
        .label {
          padding: 0 3px 0 16px;
          border-top: 0;
          color: var(--te-canvas-breadcrumb-text-color);
          transition: 0.3s;
          border: none;
          &:hover {
            cursor: pointer;
            background-color: var(--te-canvas-breadcrumb-bg-color-hover);
            &::after {
              border-left-color: var(--te-canvas-breadcrumb-arrow-border-color-hover);
            }
          }
          &::after {
            border-left-color: var(--te-canvas-breadcrumb-bg-color);
          }
        }
        &:last-child .label {
          border-right: 0px solid var(--te-canvas-breadcrumb-border-color);
          border-radius: 0;
        }
        &:first-child .label {
          border-right: 0px solid var(--te-canvas-breadcrumb-border-color);
          border-radius: 0;
          border-left: unset;
        }
      }
    }
  }
}
</style>
