<template>
  <tiny-image
    v-if="imageUrl"
    class="img-renderer-container"
    :src="imageUrl"
    :preview-src-list="[imageUrl]"
    fit="cover"
  ></tiny-image>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue'
import { useMessageContent, type BubbleMessage } from '@opentiny/tiny-robot'
import { TinyImage } from '@opentiny/vue'
const props = defineProps({
  content: {
    type: String,
    default: ''
  },
  message: {
    type: Object as PropType<BubbleMessage>,
    default: () => ({ role: 'user', content: '' })
  },
  contentIndex: {
    type: Number,
    default: 0
  }
})

const { content: messageContent } = useMessageContent(props)
const imageUrl = computed(() => props.content || messageContent.value?.content || '')
</script>

<style scoped lang="less">
.img-renderer-container {
  width: 200px;
  height: auto;
}
</style>
