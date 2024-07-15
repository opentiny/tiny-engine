// useMarkdown.js
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import ClipboardJS from 'clipboard';
import 'highlight.js/styles/a11y-dark.css';

export default function useMarkdown() {
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    highlight: function (str, lang) {
      let highlighted = str;
      if (lang && hljs.getLanguage(lang)) {
        try {
          highlighted = hljs.highlight(str, {
            language: lang,
            ignoreIllegals: true,
          }).value;
        } catch (__) {
          highlighted = md.utils.escapeHtml(str);
        }
      } else {
        highlighted = md.utils.escapeHtml(str);
      }
      return `<div class="code-block"><pre class="hljs code-container"><code>${highlighted}</code></pre><button class="copy-btn" >复制</button></div>`;
    },
  });

  function initClipboard() {
    const clipboard = new ClipboardJS('.copy-btn', {
      text: function (trigger) {
        return trigger.previousElementSibling.textContent;
      },
    });

    clipboard.on('success', function (e) {
      const originalText = '复制';
      e.trigger.textContent = '已复制';
      setTimeout(() => {
        e.trigger.textContent = originalText;
      }, 3000);
      e.clearSelection();
    });

    clipboard.on('error', function (e) {
      console.error('无法复制文本，请尝试手动复制。');
    });
  }

  return {
    md,
    initClipboard,
  };
}