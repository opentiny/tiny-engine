<template>
  <component :is="tag" v-bind="$attrs">
    <slot> </slot>
  </component>
</template>

<script>
export default {
  props: {
    tag: {
      type: String,
      default: 'div'
    }
  }
}
</script>
