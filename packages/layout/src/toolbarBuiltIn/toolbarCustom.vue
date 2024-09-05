<template>
  <component :is="toolbar.entry" v-bind="toolbar"></component>
</template>
<script>
export default {
  props: {
    toolbar: {
      type: Object,
      default: () => {}
    }
  },
  setup(props) {
    return {}
  }
}
</script>
<style></style>
