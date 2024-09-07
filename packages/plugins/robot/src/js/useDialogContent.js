import MarkdownIt from 'markdown-it'
import { Notify } from '@opentiny/vue'
import hljs from 'highlight.js'
import ClipboardJS from 'clipboard'
import 'highlight.js/styles/a11y-dark.css'

export default function useMarkdown() {
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    highlight: function (str, lang) {
      let highlighted = str
      if (lang && hljs.getLanguage(lang)) {
        try {
          highlighted = hljs.highlight(str, {
            language: lang,
            ignoreIllegals: true
          }).value
        } catch (__) {
          highlighted = md.utils.escapeHtml(str)
        }
      } else {
        highlighted = md.utils.escapeHtml(str)
      }
      const copyButtonText = '复制'
      const generateButtonText = '生成schema'
      return `<div class="code-block"><pre class="hljs code-container"><code>${highlighted}</code></pre><button class="generate-btn code-block-btn">${generateButtonText}</button><button class="copy-btn code-block-btn">${copyButtonText}</button></div>`
    }
  })

  function initClipboard() {
    const generate = new ClipboardJS('.generate-btn', {
      text: function (trigger) {
        if (trigger.classList.contains('generate-schema-btn')) {
          // 处理生成 schema 的逻辑
          Notify({
            type: 'success',
            message: '已生成',
            position: 'top-right',
            duration: 3000
          })
          return '' // 不需要复制的内容
        }
        return '生成schema了'
      }
    })

    generate.on('success', function (e) {
      const originalText = '生成schema'
      e.trigger.textContent = '已生成'
      setTimeout(() => {
        e.trigger.textContent = originalText
      }, 3000)
      e.clearSelection()
    })

    const clipboard = new ClipboardJS('.copy-btn', {
      text: function (trigger) {
        return trigger.closest('.code-block').querySelector('.hljs').textContent
      }
    })

    clipboard.on('success', function (e) {
      const originalText = '复制'
      e.trigger.textContent = '已复制'
      setTimeout(() => {
        e.trigger.textContent = originalText
      }, 3000)
      e.clearSelection()
    })

    clipboard.on('error', function () {
      Notify({
        type: 'error',
        message: '无法复制文本，请尝试手动复制。',
        position: 'top-right',
        duration: 5000
      })
    })
  }

  return {
    md,
    initClipboard
  }
}
