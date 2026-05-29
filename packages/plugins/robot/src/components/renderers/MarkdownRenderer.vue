<template>
  <div v-html="renderContent" class="markdown-renderer" :class="themeClass"></div>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue'
import DOMPurify from 'dompurify'
import MarkdownIt from 'markdown-it'
import type { Options } from 'markdown-it'
import hljs from 'highlight.js/lib/core'
import 'highlight.js/styles/github.css'

// 按需加载语言
import bash from 'highlight.js/lib/languages/bash'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import json from 'highlight.js/lib/languages/json'
import yaml from 'highlight.js/lib/languages/yaml'
import xml from 'highlight.js/lib/languages/xml'
import shell from 'highlight.js/lib/languages/shell'

// 注册语言
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('json', json)
hljs.registerLanguage('yaml', yaml)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('shell', shell)

interface MarkdownMessage {
  content: string
}

const props = defineProps({
  message: {
    type: Object as PropType<MarkdownMessage>,
    default: () => ({ content: '' })
  },
  theme: {
    type: String as PropType<'light' | 'dark'>,
    default: 'light'
  },
  options: {
    type: Object as PropType<Options>,
    default: () => ({})
  }
})

const themeClass = computed(() => `hljs-theme-${props.theme}`)

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]!))

const markdownIt = new MarkdownIt({
  html: true,
  breaks: true,
  typographer: true,
  highlight: (str: string, lang: string) => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        const { value } = hljs.highlight(str, { language: lang, ignoreIllegals: true })
        return `<pre class="hljs"><code class="language-${lang}">${value}</code></pre>`
      } catch (e) {
        /* ignore */
      }
    }
    return `<pre class="hljs"><code>${escapeHtml(str)}</code></pre>`
  },
  ...props.options
})

const renderContent = computed(() => {
  return DOMPurify.sanitize(markdownIt.render(props.message.content))
})
</script>

<style lang="less">
.markdown-renderer {
  word-break: break-word;

  pre {
    border-radius: 6px;
    padding: 1em;
    overflow: auto;
    line-height: 1.45;
    > code {
      font-size: 12px;
    }
  }

  // TODO: 适配TInyEngine主题，实现跟随主题自动切换
  /* 亮色主题 */
  &.hljs-theme-light {
    pre {
      background-color: #f6f8fa;
    }
  }

  /* 暗色主题 */
  &.hljs-theme-dark {
    pre {
      background-color: #0d1117;
    }
  }

  > *:first-child {
    margin-top: 0 !important;
  }

  > *:last-child {
    margin-bottom: 0 !important;
  }
}
</style>
