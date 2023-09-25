<template>
  <div id="tiny-bottom-panel">
    <div class="content">
      <tiny-steps v-show="data.length > 0" :data="data" @click="(index, node) => $emit('click', node)"></tiny-steps>
      <div v-show="data.length <= 0" class="tip">没有选中的节点</div>
    </div>
  </div>
</template>

<script>
import { Steps } from '@opentiny/vue'

export default {
  components: {
    TinySteps: Steps
  },
  props: {
    data: {
      type: Array,
      default: []
    }
  },
  emits: ['click']
}
</script>

<style lang="less" scoped>
#tiny-bottom-panel {
  width: 100%;
  height: var(--base-bottom-panel-height, 30px);
  bottom: 0;
  position: absolute;
  background-color: var(--ti-lowcode-breadcrumb-bg);
  z-index: 90;
  border-top: 1px solid var(--ti-lowcode-canvas-footer-border-top-color);
  .content {
    .tip {
      color: var(--ti-lowcode-breadcrumb-color);
      line-height: 30px;
      height: 30px;
      padding-left: 10px;
    }
    :deep(.tiny-steps-advanced) {
      li {
        width: unset !important;
        background: var(--ti-lowcode-breadcrumb-bg);
        a {
          padding: 0 3px 0 16px;
          border-top: 0;
          color: var(--ti-lowcode-breadcrumb-color);
          transition: 0.3s;
          &::after {
            display: inline-block;
            right: -6px;
            border-left: 6px solid var(--ti-lowcode-breadcrumb-bg);
            transition: 0.3s;
          }
          &::before {
            display: inline-block;
            right: -7px;
            left: unset;
            border-left: 6px solid var(--ti-lowcode-breadcrumb-icon-color);
            transition: 0.3s;
            z-index: 1;
          }
          &:hover {
            background: var(--ti-lowcode-breadcrumb-hover-bg);
            &::after {
              border-left-color: var(--ti-lowcode-breadcrumb-hover-bg);
            }
          }
        }
        &:last-child a {
          border-right: 0px solid var(--ti-lowcode-breadcrumb-color);
          border-radius: 0;
        }
        &:first-child a {
          border-right: 0px solid var(--ti-lowcode-breadcrumb-color);
          border-radius: 0;
          border-left: unset;
        }
      }
    }
  }
}
</style>
