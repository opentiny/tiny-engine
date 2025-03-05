<template>
  <div class="canvas-flex-box">
    <slot> </slot>
  </div>
</template>

<script setup>
import { computed, defineProps } from 'vue'
import { getStyleValue } from './helper'

const props = defineProps({
  flexDirection: {
    type: String,
    default: 'row'
  },
  gap: {
    type: [String, Number],
    default: '8px'
  },
  padding: {
    type: [String, Number],
    default: '8px'
  },
  alignItems: {
    type: String,
    default: 'center'
  },
  justifyContent: {
    type: String,
    default: 'flex-start'
  }
})

const styles = computed(() => ({
  flexDirection: props.flexDirection,
  gap: getStyleValue(props.gap),
  padding: getStyleValue(props.padding),
  alignItems: props.alignItems,
  justifyContent: props.justifyContent
}))
</script>
<style lang="less" scoped>
.canvas-flex-box {
  display: flex;
  flex: 1 1 0px;
  flex-direction: v-bind('styles.flexDirection');
  gap: v-bind('styles.gap');
  padding: v-bind('styles.padding');
  align-items: v-bind('styles.alignItems');
  justify-content: v-bind('styles.justifyContent');
  :deep(.canvas-container) {
    width: 100%;
  }
}
</style>
