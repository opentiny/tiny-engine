<template>
  <div>{{ title }}</div>
</template>

<script lang="ts">
export default {
  props: {
    title: {
      type: String,
      default: ''
    }
  }
}
</script>
