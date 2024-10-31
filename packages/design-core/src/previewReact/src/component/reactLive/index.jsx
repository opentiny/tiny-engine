import { useRef, useState, useLayoutEffect } from 'react'
import prettier from 'prettier'
import parserHtml from 'prettier/parser-html'
import parseCss from 'prettier/parser-postcss'
import parserBabel from 'prettier/parser-babel'
import { LiveProvider, LiveError, LivePreview } from 'react-live'
import * as Antd from 'antd'
import { parseView } from '../util/parseViews'
import srcFiles from '../../srcFiles'
import { FileSelector } from '../fileSelector/index'
import { ReactMonacoEditor } from '../monacoEditor'
import { ErrorBoundary } from '../errorboundry'
import './index.css'

const defaultOption = {
  singleQuote: true,
  printWidth: 120,
  semi: false,
  trailingComma: 'none'
}

const App = (props) => {
  const fileName = useRef('')
  const newContent = useRef('')
  const { views } = props

  const [code, setCode] = useState(srcFiles['Main.jsx'] || '')
  const [scope, setScope] = useState({ Antd })

  const handleFileChange = (file) => {
    setCode(srcFiles[file])
    fileName.current = file
  }

  const handleChange = (newCode) => {
    setCode(newCode)
    srcFiles[fileName.current] = newCode
  }

  useLayoutEffect(() => {
    if (!views || Object.keys(views).length === 0) return

    const formattedCode = prettier.format(views['Main.jsx'] || '', {
      parser: 'babel',
      plugins: [parserBabel, parseCss, parserHtml, ...(defaultOption.customPlugin || [])],
      ...defaultOption
    })

    views['Main.jsx'] = formattedCode
    newContent.current = parseView(views)

    if (newContent.current) {
      srcFiles['Main.jsx'] = newContent.current
      // 主动触发一下选择函数
      handleFileChange('Main.jsx')
    }
  }, [views])

  // 需要选择性为文件注入 scope
  useLayoutEffect(() => {
    let temp = { Antd }

    Object.keys(srcFiles).forEach((eachFileName) => {
      // 传入scope的组件名不能与当前所点击的文件名一致
      if (eachFileName !== fileName.current) {
        const tranFileName = eachFileName.split('.')[0]
        temp[tranFileName] = srcFiles[eachFileName]
      }
    })
    setScope(temp)
  }, [])

  return (
    <div style={{ display: 'flex' }}>
      <ErrorBoundary>
        <LiveProvider code={code} noInline={true} scope={scope}>
          <div style={{ width: '50%', height: '80vh' }}>
            <FileSelector onSelectFile={handleFileChange} />
            <ReactMonacoEditor onChange={(newCode) => handleChange(newCode)} code={code} />
            <LiveError id="codeError" />
          </div>
          <div style={{ flex: 1, height: '80vh', marginTop: '46px' }}>
            <LivePreview />
          </div>
        </LiveProvider>
      </ErrorBoundary>
    </div>
  )
}

export default App
