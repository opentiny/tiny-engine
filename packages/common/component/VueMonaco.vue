<template>
  <div ref="monacoRef"></div>
</template>
<script>
import * as monacoEditor from 'monaco-editor'
import { watch, onMounted, nextTick, onBeforeUnmount, ref } from 'vue'
import { formatString } from '../js/ast'

const defaultMonacoEditorTheme = 'vs'
const globalMonacoEditorTheme = ref(defaultMonacoEditorTheme)

/**
 * @param {'vs' | 'vs-dark' | undefined} theme
 */
export const setGlobalMonacoEditorTheme = (theme) => {
  globalMonacoEditorTheme.value = theme || defaultMonacoEditorTheme
}

export default {
  name: 'MonacoEditor',
  model: {
    event: 'change'
  },
  props: {
    original: {
      type: String
    },
    value: {
      type: String,
      required: true
    },
    language: {
      type: String
    },
    options: {
      type: Object
    },
    amdRequire: {
      type: Function
    },
    diffEditor: {
      type: Boolean,
      default: false
    }
  },
  emits: ['change', 'editorWillMount', 'editorDidMount', 'shortcutSave'],
  setup(props, { emit }) {
    const vueMonaco = {
      editor: null,
      monaco: null
    }
    const monacoRef = ref(null)

    const defaultOptions = {
      autoIndent: true,
      automaticLayout: true,
      formatOnPaste: true,
      roundedSelection: true,
      tabSize: 2
    }

    const focus = () => vueMonaco.editor && vueMonaco.editor.focus()

    const getMonaco = () => vueMonaco.monaco

    const getEditor = () => vueMonaco.editor

    const getModifiedEditor = () => (props.diffEditor ? vueMonaco.editor.getModifiedEditor() : vueMonaco.editor)

    const getOriginalEditor = () => (props.diffEditor ? vueMonaco.editor.getOriginalEditor() : vueMonaco.editor)

    const getModelMarkers = () => vueMonaco.monaco.editor.getModelMarkers()

    const initMonaco = (monaco) => {
      emit('editorWillMount', vueMonaco.monaco)

      const options = {
        ...defaultOptions,
        value: props.value,
        theme: globalMonacoEditorTheme.value,
        language: props.language,
        ...props.options
      }

      if (props.diffEditor) {
        vueMonaco.editor = monaco.editor.createDiffEditor(monacoRef.value, options)
        const originalModel = monaco.editor.createModel(props.original, props.language)
        const modifiedModel = monaco.editor.createModel(props.value, props.language)

        vueMonaco.editor.setModel({
          original: originalModel,
          modified: modifiedModel
        })
      } else {
        vueMonaco.editor = monaco.editor.create(monacoRef.value, options)
      }

      vueMonaco.editor.addCommand(monacoEditor.KeyMod.CtrlCmd | monacoEditor.KeyCode.KeyS, () => {
        // 快捷键 ctrl + s 或 command + s 保存
        emit('shortcutSave')
      })

      const editor2 = getModifiedEditor()

      editor2.onDidChangeModelContent((event) => {
        const value = editor2.getValue()

        if (props.value !== value) {
          emit('change', value, event)
        }
      })

      emit('editorDidMount', vueMonaco.editor)
    }

    onMounted(() => {
      if (props.amdRequire) {
        props.amdRequire(['vs/editor/editor.main'], () => {
          vueMonaco.monaco = window.monaco
          nextTick(() => {
            initMonaco(window.monaco)
          })
        })
      } else {
        vueMonaco.monaco = monacoEditor
        nextTick(() => {
          initMonaco(vueMonaco.monaco)
          vueMonaco.editor.addAction({
            id: 'prettier',
            label: 'Prettier',
            precondition: null,
            contextMenuGroupId: 'navigation',
            run(editor) {
              const currentValue = editor.getValue()
              const newValue = formatString(currentValue, props.options.language)

              if (newValue !== currentValue) {
                editor.setValue(newValue)
              }
            }
          })
        })
      }
    })

    onBeforeUnmount(() => {
      vueMonaco.editor && vueMonaco.editor.dispose()
    })

    watch(
      () => props.options,
      (options) => {
        if (vueMonaco.editor) {
          const editor2 = getModifiedEditor()

          editor2.updateOptions(options)
        }
      },
      {
        deep: true
      }
    )

    watch(
      () => props.value,
      (newValue) => {
        if (vueMonaco.editor) {
          const editor = getModifiedEditor()

          if (newValue !== editor.getValue()) {
            editor.setValue(newValue)
          }
        }
      }
    )

    watch(
      () => props.original,
      (newValue) => {
        if (vueMonaco.editor && props.diffEditor) {
          const editor = getOriginalEditor()

          if (newValue !== editor.getValue()) {
            editor.setValue(newValue)
          }
        }
      }
    )

    watch(
      () => props.language,
      (newVal) => {
        if (vueMonaco.editor) {
          const editor = getModifiedEditor()
          vueMonaco.monaco.editor.setModelLanguage(editor.getModel(), newVal)
        }
      }
    )

    watch(globalMonacoEditorTheme, (newVal) => {
      if (vueMonaco.editor) {
        vueMonaco.monaco.editor.setTheme(newVal)
      }
    })

    return {
      getMonaco,
      getEditor,
      getModifiedEditor,
      getOriginalEditor,
      initMonaco,
      focus,
      monacoRef,
      getModelMarkers
    }
  }
}
</script>
