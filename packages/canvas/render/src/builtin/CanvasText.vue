<template>
  <span :class="['canvas-text', className]">{{ text }}</span>
</template>

<script lang="ts">
export default {
  props: {
    text: {
      type: String,
      default: ''
    },
    className: {
      type: String,
      default: ''
    }
  }
}
</script>
