<template>
  <svg :class="svgClass" v-bind="$attrs" :style="{ color: color }">
    <use :xlink:href="iconName" />
  </svg>
</template>

<script>
import { computed, defineComponent } from 'vue'

export default defineComponent({
  props: {
    name: {
      type: String,
      required: true
    },
    color: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    const iconName = computed(() => `#icon-${props.name}`)

    const svgClass = computed(() => {
      if (props.name) {
        return `svg-icon icon-${props.name}`
      }

      return 'svg-icon'
    })

    return {
      iconName,
      svgClass
    }
  }
})
</script>

<style lang="less" scoped>
.svg-icon {
  width: 1em;
  height: 1em;
  fill: currentColor;
  vertical-align: middle;
  font-size: 16px;
}
</style>
