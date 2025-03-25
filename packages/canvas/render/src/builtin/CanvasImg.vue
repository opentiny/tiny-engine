<template>
  <img :src="src" :style="style" />
</template>

<script lang="ts">
export default {
  props: {
    src: {
      type: String,
      default: ''
    },
    style: {
      type: String,
      default: ''
    }
  }
}
</script>
