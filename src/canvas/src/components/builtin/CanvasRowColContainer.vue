<template>
  <div class="row-col-container">
    <slot>
      <canvas-placeholder :placeholder="$attrs.placeholder"></canvas-placeholder>
    </slot>
  </div>
</template>

<script>
import { computed } from 'vue'
import CanvasPlaceholder from './CanvasPlaceholder.vue'
import { getStyleValue } from './helper'

export default {
  components: {
    CanvasPlaceholder
  },
  props: {
    rowGap: {
      type: [String, Number],
      default: ''
    }
  },
  setup(props) {
    const styles = computed(() => ({
      rowGap: getStyleValue(props.rowGap)
    }))

    return {
      styles
    }
  }
}
</script>

<style lang="less" scoped>
.row-col-container {
  display: flex;
  flex-direction: column;
  row-gap: v-bind('styles.rowGap');
}
</style>
