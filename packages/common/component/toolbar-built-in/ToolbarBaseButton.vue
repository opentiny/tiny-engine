<template>
  <tiny-button v-bind="extendAttrs" class="toolbar-button">
    <span class="svg-wrap">
      <svg-icon v-if="icon" :name="icon"></svg-icon>
      <span v-if="options?.showDots" class="dots"></span>
    </span>
    <span class="save-title">{{ content }}</span>
    <slot></slot>
  </tiny-button>
</template>
<script>
import { inject } from 'vue'
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
  },
  setup() {
    const extendAttrs = inject('extend-attributes') || {}
    return {
      extendAttrs
    }
  }
}
</script>
<style lang="less" scoped>
.toolbar-button {
  background-color: var(--ti-lowcode-toolbar-button-bg) !important;
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
  .dots {
    width: 6px;
    height: 6px;
    background: var(--ti-lowcode-toolbar-dot-color);
    border-radius: 50%;
    display: inline-block;
    position: absolute;
    top: -2px;
    right: -2px;
    z-index: 100;
  }
}

.save-title {
  margin: 0 6px;
}
</style>
