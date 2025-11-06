<template>
  <tiny-image
    v-if="content"
    class="img-renderer-container"
    :src="content"
    :preview-src-list="[content]"
    fit="cover"
  ></tiny-image>
</template>

<script setup lang="ts">
import { TinyImage } from '@opentiny/vue'
const { content } = defineProps({
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
