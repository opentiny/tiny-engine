<template>
  <div
    class="row-col-container"
    :style="{
      'row-gap': styles.rowGap
    }"
  >
    <slot> </slot>
  </div>
</template>

<script setup>
import { computed, defineProps } from 'vue'
import { getStyleValue } from './helper'

const props = defineProps({
  rowGap: {
    type: [String, Number],
    default: ''
  }
})

const styles = computed(() => ({
  rowGap: getStyleValue(props.rowGap)
}))
</script>

<style lang="less" scoped>
.row-col-container {
  display: flex;
  flex-direction: column;
}
</style>
