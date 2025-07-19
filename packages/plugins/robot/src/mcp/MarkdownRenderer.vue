<template>
  <div v-html="renderContent"></div>
</template>

<script setup lang="ts">
import DOMPurify from 'dompurify'
import { default as MarkdownIt } from 'markdown-it'
import { computed } from 'vue'

const md = new MarkdownIt({
  html: true,
  breaks: true,
  typographer: true
})
const props = defineProps<{
  type: 'markdown' | 'text'
  content: string
}>()

const renderContent = computed(() => {
  const htmlContent = md.render(props.content)
  return DOMPurify.sanitize(htmlContent)
})
</script>

<style lang="less" scoped></style>
