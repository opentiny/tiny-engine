<template>
  <div v-html="renderContent" class="robot-markdown-renderer"></div>
</template>

<script setup lang="ts">
import DOMPurify from 'dompurify'
import MarkdownIt, { type Options as MarkdownItOptions } from 'markdown-it'
import hljs from 'highlight.js'
import { computed } from 'vue'
import 'highlight.js/styles/github.min.css'

const defaultMarkdownItOptions = {
  breaks: true,
  typographer: true,
  highlight: function (str: string, lang: string) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlightAuto(str).value
      } catch (__) {
        /* ignore */
      }
    }

    return str
  }
}

const props = defineProps<{
  type: 'markdown' | 'text'
  content: string
  options?: MarkdownItOptions
}>()

const markdownIt = computed(
  () =>
    new MarkdownIt({
      ...defaultMarkdownItOptions,
      ...props.options
    })
)

const renderContent = computed(() => {
  const htmlContent = markdownIt.value.render(props.content)
  return DOMPurify.sanitize(htmlContent)
})
</script>

<style lang="less" scoped>
.robot-markdown-renderer {
  word-break: break-word;
  & > *:first-child {
    margin-top: 0 !important;
  }
  & > *:last-child {
    margin-bottom: 0 !important;
  }
}
</style>
