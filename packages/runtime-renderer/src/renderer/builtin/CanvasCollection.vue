<template>
  <component :is="tag" v-bind="$attrs">
    <slot>
      <canvas-placeholder></canvas-placeholder>
    </slot>
  </component>
</template>

<script lang="ts">
import CanvasPlaceholder from './CanvasPlaceholder.vue'
export default {
  components: {
    CanvasPlaceholder
  },
  props: {
    tag: {
      type: String,
      default: 'div'
    },
    schema: {
      type: Object,
      default: () => ({})
    },
    dataSource: [String, Array, Number]
  }
}
</script>
