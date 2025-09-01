<template>
  <div
    :class="[
      'canvas-navigate',
      { 'canvas-navigate-horizontal': type === 'horizontal' },
      { 'canvas-navigate-vertical': type === 'vertical' }
    ]"
  >
    <slot> </slot>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = defineProps({
  type: {
    type: String,
    default: 'horizontal'
  }
})
</script>

<style lang="less" scoped>
.canvas-navigate {
  display: flex;
  padding: 8px 12px;
  &-horizontal {
    align-items: center;
    justify-content: center;
  }
  &-vertical {
    flex-direction: column;
  }
}
</style>
