<template>
  <div class="svg-wrap">
    <span v-if="options?.showDots" class="dot"></span>
    <tiny-button class="toolbar-button">
      <svg-icon v-if="icon" :name="icon"></svg-icon>
      <span v-if="options?.showTitle !== false" class="save-title">{{ content }}</span>
      <slot></slot>
    </tiny-button>
  </div>
</template>
<script lang="ts">
import { Button } from '@opentiny/vue'
import type { Component } from 'vue'

export default {
  components: {
    TinyButton: Button as Component
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
  background-color: var(--te-component-toolbar-base-button-bg-color) !important;
  border: none !important;
  min-width: 60px;
  height: 26px;
  line-height: 24px;
  padding: 0 8px;
  border-radius: 4px;
  margin-right: 4px;
  .svg-icon {
    color: var(--te-component-common-icon-color-primary) !important;
  }
}

.svg-wrap {
  position: relative;

  .dot {
    position: absolute;
    width: 6px;
    height: 6px;
    background: var(--te-component-common-error-color);
    border-radius: 50%;
    top: -3px;
    right: 2px;
    z-index: 100;
  }
}
.tiny-popover.no-arrow {
  margin-top: 12px;
}
</style>
