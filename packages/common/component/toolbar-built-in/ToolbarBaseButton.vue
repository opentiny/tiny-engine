<template>
  <div class="svg-wrap">
    <span v-if="options?.showDots" class="dot"></span>
    <tiny-button class="toolbar-button">
      <svg-icon v-if="icon" :name="icon"></svg-icon>
      <span class="save-title">{{ content }}</span>
      <slot></slot>
    </tiny-button>
  </div>
</template>
<script>
import { Button } from '@opentiny/vue'

export default {
  components: {
    TinyButton: Button
  },
  props: {
    icon: {
      type: String,
      default: ''
    },
    content: {
      type: String,
      default: ''
    },
    options: {
      type: Object,
      default: () => ({})
    }
  }
}
</script>
<style lang="less" scoped>
.toolbar-button {
  background-color: var(--te-common-bg-prompt) !important;
  border: none !important;
  min-width: 70px;
  height: 26px;
  line-height: 24px;
  padding: 0 8px;
  border-radius: 4px;
  margin-right: 4px;
}

.svg-wrap {
  position: relative;

  .dot {
    position: absolute;
    width: 6px;
    height: 6px;
    background: var(--ti-lowcode-toolbar-dot-color);
    border-radius: 50%;
    top: -3px;
    right: 2px;
    z-index: 100;
  }
  .svg-icon.svg-icon.svg-icon {
    color: var(--te-common-icon-primary);
  }
}
</style>
