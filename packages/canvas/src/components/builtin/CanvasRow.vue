<template>
  <div class="canvas-row">
    <slot>
      <canvas-placeholder :placeholder="$attrs.placeholder"></canvas-placeholder>
    </slot>
  </div>
</template>

<script>
import { computed } from 'vue'
import CanvasPlaceholder from './CanvasPlaceholder.vue'
import { getStyleValue, alignMap, justAlignMap } from './helper'

export default {
  components: {
    CanvasPlaceholder
  },
  props: {
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
  },
  setup(props) {
    const styles = computed(() => ({
      minHeight: getStyleValue(props.minHeight),
      rowGap: getStyleValue(props.rowGap),
      colGap: getStyleValue(props.colGap),
      align: alignMap[props.align] || 'stretch',
      justAlign: justAlignMap[props.justAlign] || 'flex-start'
    }))

    return {
      styles
    }
  }
}
</script>

<style lang="less" scoped>
.canvas-row {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: v-bind('styles.justAlign');
  align-items: v-bind('styles.align');
  column-gap: v-bind('styles.rowGap');
  row-gap: v-bind('styles.colGap');
  min-height: v-bind('styles.minHeight');
}
</style>
