<template>
  <component :is="tag" v-bind="$attrs">
    <slot>
      <canvas-placeholder :placeholder="$attrs.placeholder"></canvas-placeholder>
    </slot>
  </component>
</template>

<script>
import CanvasPlaceholder from './CanvasPlaceholder.vue'
export default {
  components: {
    CanvasPlaceholder
  },
  props: {
    tag: {
      type: String,
      default: 'div'
    }
  }
}
</script>
