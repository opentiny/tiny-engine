<template>
  <tiny-popover
    :trigger="trigger"
    :open-delay="500"
    popper-class="toolbar-right-popover"
    append-to-body
    :content="content"
  >
    <slot></slot>
    <template #reference>
      <span class="icon">
        <span class="icon-hides" v-bind="$attrs">
          <svg-icon :name="icon"></svg-icon>
          <span v-if="options?.showDots" class="dots"></span>
        </span>
      </span>
    </template>
  </tiny-popover>
</template>
<script lang="ts">
import { Popover } from '@opentiny/vue'
import type { Component } from 'vue'

export default {
  components: {
    TinyPopover: Popover as Component
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
    },
    trigger: {
      type: String,
      default: 'hover'
    }
  }
}
</script>

<style lang="less" scoped>
.dots {
  width: 6px;
  height: 6px;
  background: var(--te-component-common-error-color);
  border-radius: 50%;
  display: inline-block;
  position: absolute;
  top: 4px;
  right: 3px;
  z-index: 100;
}
</style>
