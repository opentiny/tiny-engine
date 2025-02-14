<template>
  <component :is="tag" v-bind="$attrs">
    <slot> </slot>
  </component>
</template>

<script lang="ts">
export default {
  props: {
    tag: {
      type: String,
      default: 'div'
    }
  }
}
</script>
