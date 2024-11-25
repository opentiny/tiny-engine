<template>
  <component :is="tag" v-bind="$attrs">
    <slot>
      <canvas-placeholder></canvas-placeholder>
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
    // TODO: 这里实际上没有提供配置的入口，可以考虑删除了(出码也没有定制)
    tag: {
      type: String,
      default: 'div'
    }
  }
}
</script>
