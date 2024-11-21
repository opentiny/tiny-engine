<template>
  <slot>
    <canvas-placeholder v-bind="$attrs"></canvas-placeholder>
  </slot>
</template>

<script>
import CanvasPlaceholder from './CanvasPlaceholder.vue'
export default {
  components: {
    CanvasPlaceholder
  },
  props: {
    name: {
      type: String
    },
    params: {
      type: String
    }
  }
}
</script>
