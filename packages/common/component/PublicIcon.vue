<template>
  <span class="public-icon">
    <component :is="name" v-if="isTinyIcon" />
    <svg-icon v-else :name="name" :class="svgClass"></svg-icon>
  </span>
</template>

<script>
import { computed } from 'vue'

export default {
  props: {
    name: {
      type: String,
      default: 'cross'
    },
    svgClass: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    const isTinyIcon = computed(() => props.name.toLowerCase().indexOf('icon') === 0)

    return {
      isTinyIcon
    }
  }
}
</script>
