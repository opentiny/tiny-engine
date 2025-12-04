<template>
  <tiny-image
    v-if="props.content"
    class="img-renderer-container"
    :src="props.content"
    :preview-src-list="[props.content]"
    fit="cover"
  ></tiny-image>
</template>

<script setup lang="ts">
import { TinyImage } from '@opentiny/vue'
const props = defineProps({
  content: {
    type: String,
    default: ''
  }
})
</script>

<style scoped lang="less">
.img-renderer-container {
  width: 200px;
  height: auto;
}
</style>
