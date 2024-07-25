<template>
  <div v-html="cleanRenderedMarkdown" />
</template>

<script>
import { ref, onMounted, watch } from 'vue'
import useMarkdown from './js/useDialogContent'
import DOMPurify from 'dompurify'

export default {
  props: {
    markdownContent: String
  },
  setup(props) {
    const cleanRenderedMarkdown = ref('')
    const { md, initClipboard } = useMarkdown()

    let clipboardInitialized = false
    const render = (text) => {
      cleanRenderedMarkdown.value = DOMPurify.sanitize(md.render(text))
      if (!clipboardInitialized) {
        initClipboard()
        clipboardInitialized = true
      }
    }

    watch(
      () => props.markdownContent,
      (newValue) => {
        render(newValue)
      }
    )

    onMounted(() => {
      render(props.markdownContent)
    })

    return {
      cleanRenderedMarkdown
    }
  }
}
</script>
<style lang="less">
.code-block {
  position: relative;
}
.code-block:hover .copy-btn {
  opacity: 1;
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.code-container {
  padding: 10px;
  border-radius: 5px;
}
.copy-btn {
  width: 56px;
  font-size: 12px;
  background-color: #ccc;
  border: none;
  padding: 5px 10px;
  cursor: pointer;
  position: absolute;
  top: 5px;
  right: 5px;
  border-radius: 3px;
  transition: all 0.3s;
  opacity: 0;
}
</style>
