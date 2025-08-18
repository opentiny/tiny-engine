<template>
  <div v-html="renderContent" class="markdown-renderer" :class="themeClass"></div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted, nextTick } from 'vue'
import DOMPurify from 'dompurify'
import MarkdownIt, { type Options } from 'markdown-it'
import hljs from 'highlight.js/lib/core'
import 'highlight.js/styles/github.css'
import 'highlight.js/styles/github-dark.css'

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

const props = defineProps({
  content: {
    type: String,
    required: true
  },
  theme: {
    type: String as () => 'light' | 'dark',
    default: 'dark'
  },
  options: {
    type: Object as () => Options,
    default: () => ({})
  }
})

const themeClass = computed(() => `hljs-theme-${props.theme}`)

const markdownIt = new MarkdownIt({
  html: true,
  breaks: true,
  typographer: true,
  highlight: (str: string, lang: string) => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs"><code>${
          hljs.highlight(str, {
            language: lang,
            ignoreIllegals: true
          }).value
        }</code></pre>`
      } catch (e) {
        /* ignore */
      }
    }
    return `<pre class="hljs"><code>${DOMPurify.sanitize(str)}</code></pre>`
  },
  ...props.options
})

const renderContent = computed(() => {
  return DOMPurify.sanitize(markdownIt.render(props.content))
})

// 动态切换主题时重新高亮
watch(
  () => props.theme,
  () => {
    nextTick(() => {
      document.querySelectorAll('.markdown-renderer pre code').forEach((el) => {
        hljs.highlightElement(el as HTMLElement)
      })
    })
  }
)

onMounted(() => {
  nextTick(() => {
    document.querySelectorAll('.markdown-renderer pre code').forEach((el) => {
      hljs.highlightElement(el as HTMLElement)
    })
  })
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
  }

  /* 亮色主题 */
  &.hljs-theme-light {
    @import 'highlight.js/styles/github.css';

    pre {
      background-color: #f6f8fa;
    }
  }

  /* 暗色主题 */
  &.hljs-theme-dark {
    @import 'highlight.js/styles/github-dark.css';

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
