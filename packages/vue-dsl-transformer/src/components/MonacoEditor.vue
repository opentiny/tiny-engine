<template>
  <div class="editor-container">
    <div v-if="loading" class="loading">加载编辑器中...</div>
    <div v-if="error" class="error">{{ error }}</div>
    <div ref="editorRef" class="monaco-editor"></div>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as monaco from 'monaco-editor'

export default {
  name: 'MonacoEditor',
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    language: {
      type: String,
      default: 'javascript'
    },
    theme: {
      type: String,
      default: 'vs'
    },
    options: {
      type: Object,
      default: () => ({
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        fontSize: 14,
        lineNumbers: 'on',
        wordWrap: 'on'
      })
    }
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { emit }) {
    const editorRef = ref(null)
    const loading = ref(true)
    const error = ref('')
    let editor = null

    const initEditor = () => {
      if (!editorRef.value) return

      try {
        editor = monaco.editor.create(editorRef.value, {
          value: props.modelValue,
          language: props.language,
          theme: props.theme,
          automaticLayout: true,
          ...props.options
        })

        editor.onDidChangeModelContent(() => {
          const value = editor.getValue()
          emit('update:modelValue', value)
          emit('change', value)
        })

        // 确保编辑器能够正确布局
        setTimeout(() => {
          if (editor) {
            editor.layout()
          }
        }, 100)

        loading.value = false
      } catch (err) {
        error.value = `编辑器加载失败: ${err.message}`
        loading.value = false
      }
    }

    watch(() => props.modelValue, (newValue) => {
      if (editor && editor.getValue() !== newValue) {
        editor.setValue(newValue)
      }
    })

    watch(() => props.language, (newLanguage) => {
      if (editor) {
        monaco.editor.setModelLanguage(editor.getModel(), newLanguage)
      }
    })

    onMounted(() => {
      initEditor()
    })

    onBeforeUnmount(() => {
      if (editor) {
        editor.dispose()
      }
    })

    return {
      editorRef,
      loading,
      error
    }
  }
}
</script>

<style scoped>
.monaco-editor {
  width: 100%;
  height: 100%;
  min-height: 400px;
}

.editor-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>