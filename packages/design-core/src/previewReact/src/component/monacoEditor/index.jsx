import { useRef } from 'react'
import MonacoEditor from 'react-monaco-editor'
import * as monaco from 'monaco-editor'

export const ReactMonacoEditor = ({ code, onChange }) => {
  const editorRef = useRef(null)
  // 定义自定义主题
  monaco.editor.defineTheme('myCustomTheme', {
    base: 'vs', // 继承默认亮色主题
    inherit: true,
    rules: [
      { token: 'comment', foreground: '008800', fontStyle: 'italic' },
      { token: 'keyword', foreground: '0000ff' },
      { token: 'identifier', foreground: '000000' },
      { token: 'string', foreground: 'a31515' }
      // 添加其他高亮规则
    ],
    colors: {
      'editor.foreground': '#000000', // 文字颜色设置为黑色
      'editor.background': '#FFFFFF', // 背景颜色设置为白色
      'editorCursor.foreground': '#000000', // 光标颜色设置为黑色
      'editor.lineHighlightBackground': '#0000FF20', // 行高亮背景
      'editorLineNumber.foreground': '#008800' // 行号颜色
    }
  })

  // 设置主题
  monaco.editor.setTheme('myCustomTheme')

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor

    // 在编辑器加载完成后设置格式化
    monaco.editor.setModelLanguage(editor.getModel(), 'javascript')

    // 添加格式化快捷键 (例如: Ctrl+S)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      editor.getAction('editor.action.formatDocument').run()
    })
  }

  return (
    <MonacoEditor
      width="100%"
      height="100%"
      language="javascript"
      value={code}
      onChange={onChange}
      editorDidMount={handleEditorDidMount}
      options={{
        selectOnLineNumbers: true,
        automaticLayout: true
      }}
    />
  )
}

export default MonacoEditor
