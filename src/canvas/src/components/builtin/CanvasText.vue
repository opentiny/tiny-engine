<template>
  <span :class="['canvas-text', className]">{{ text }}</span>
</template>

<script>
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
