const vueMonaco = {
  /**
   * @type {import('monaco-editor').editor.IStandaloneCodeEditor|import('monaco-editor').editor.IDiffEditor}
   */
  editor: null,
  monaco: null
}

const focus = () => vueMonaco.editor && vueMonaco.editor.focus()
const getMonaco = () => vueMonaco.monaco
const getEditor = () => vueMonaco.editor
/**
 *
 * @param {Record<string,any>} props
 */
const getModifiedEditor = (props) => (props.diffEditor ? vueMonaco.editor.getModifiedEditor() : vueMonaco.editor)
/**
 *
 * @param {Record<string,any>} props
 * @returns
 */
const getOriginalEditor = (props) => (props.diffEditor ? vueMonaco.editor.getOriginalEditor() : vueMonaco.editor)
const getModelMarkers = () => vueMonaco.monaco.editor.getModelMarkers()

/**
 *
 * @param {typeof import('monaco-editor')} monaco
 * @param {*} emit
 * @param {*} props
 * @param {*} monacoRef
 */
const init = async (monaco, emit, props, monacoRef) => {
  emit('editorWillMount', vueMonaco.monaco)
  const options = { value: props.value, theme: props.theme, language: props.language, ...props.options }
  if (props.diffEditor) {
    vueMonaco.editor = monaco.editor.createDiffEditor(monacoRef.value, options)
    const originalModel = monaco.editor.createModel(props.original, props.language)
    const modifiedModel = monaco.editor.createModel(props.value, props.language)

    vueMonaco.editor.setModel({
      original: originalModel,
      modified: modifiedModel
    })
  } else {
    vueMonaco.editor = monaco.editor.create(monacoRef.value, {
      ...options
    })
  }

  const editor2 = getModifiedEditor(props)

  editor2.onDidChangeModelContent((event) => {
    const value = editor2.getValue()

    if (props.value !== value) {
      emit('change', value, event)
    }
  })

  emit('editorDidMount', vueMonaco.editor)
}

export default () => {
  return {
    focus,
    getMonaco,
    getEditor,
    getModifiedEditor,
    getOriginalEditor,
    getModelMarkers,
    init,
    vueMonaco
  }
}
