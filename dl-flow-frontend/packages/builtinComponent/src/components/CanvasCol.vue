<template>
  <div ref="colRef" class="canvas-col">
    <slot></slot>
  </div>
</template>

<script setup>
import { computed, defineProps } from 'vue'
import { getStyleValue, alignMap, justAlignMap } from './helper'

const props = defineProps({
  flexBasis: {
    type: String,
    default: '0px'
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
  },
  grow: {
    type: Boolean,
    default: true
  },
  shrink: {
    type: Boolean,
    default: true
  },
  widthType: {
    type: String,
    default: 'auto'
  }
})

const getFlex = () => {
  const { flexBasis, grow, shrink, widthType } = props

  if (widthType === 'fixed') {
    return `0 0 ${getStyleValue(flexBasis)}`
  }

  return `${Number(grow)} ${Number(shrink)} ${getStyleValue(flexBasis)}`
}

const styles = computed(() => ({
  flex: getFlex(props.flexBasis),
  rowGap: getStyleValue(props.rowGap),
  colGap: getStyleValue(props.colGap),
  align: alignMap[props.align] || 'stretch',
  justAlign: justAlignMap[props.justAlign] || 'flex-start'
}))
</script>

<style lang="less" scoped>
.canvas-col {
  display: flex;
  flex: v-bind('styles.flex');
  flex-direction: column;
  flex-wrap: nowrap;
  row-gap: v-bind('styles.rowGap');
  column-gap: v-bind('styles.colGap');
  align-items: v-bind('styles.align');
  justify-content: v-bind('styles.justAlign');
}
</style>
