<template>
  <div
    class="canvas-row"
    :style="{
      'min-height': styles.minHeight,
      'row-gap': styles.rowGap,
      'column-gap': styles.colGap,
      'align-items': styles.align,
      'justify-content': styles.justAlign
    }"
  >
    <slot></slot>
  </div>
</template>

<script setup>
import { computed, defineProps } from 'vue'
import { getStyleValue, alignMap, justAlignMap } from './helper'

const props = defineProps({
  minHeight: {
    type: [String, Number],
    default: ''
  },
  rowGap: {
    type: [String, Number],
    default: ''
  },
  colGap: {
    type: [String, Number],
    default: ''
  },
  align: {
    type: [String, Number],
    default: ''
  },
  justAlign: {
    type: [String, Number],
    default: ''
  }
})

const styles = computed(() => ({
  minHeight: getStyleValue(props.minHeight),
  rowGap: getStyleValue(props.rowGap),
  colGap: getStyleValue(props.colGap),
  align: alignMap[props.align] || 'stretch',
  justAlign: justAlignMap[props.justAlign] || 'flex-start'
}))
</script>

<style lang="less" scoped>
.canvas-row {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
}
</style>
