/**
 * Copyright (c) 2023 - present TinyEngine Authors.
 * Copyright (c) 2023 - present Huawei Cloud Computing Technologies Co., Ltd.
 *
 * Use of this source code is governed by an MIT-style license.
 *
 * THE OPEN SOURCE SOFTWARE IN THIS PRODUCT IS DISTRIBUTED IN THE HOPE THAT IT WILL BE USEFUL,
 * BUT WITHOUT ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS FOR
 * A PARTICULAR PURPOSE. SEE THE APPLICABLE LICENSES FOR MORE DETAILS.
 *
 */

import { ref, reactive, watchEffect, onActivated, nextTick } from 'vue'
import { useCanvas, useModal, useNotify } from '@opentiny/tiny-engine-controller'
import { string2Ast, ast2String, insertName, formatString } from '@opentiny/tiny-engine-controller/js/ast'
import { constants } from '@opentiny/tiny-engine-utils'
import { lint } from '@opentiny/tiny-engine-controller/js/linter'
import { isFunction } from '@opentiny/vue-renderless/grid/static'

const { SCHEMA_DATA_TYPE } = constants
const { message, confirm } = useModal()

const state = reactive({
  linterWorker: null,
  script: '',
  isChanged: false,
  hasError: false,
  editorSelection: null,
  completionProvider: null
})

const monaco = ref(null)

let scriptAst = null

export const getMethods = () => {
  const pageSchema = useCanvas().canvasApi.value.getSchema?.() || {}

  pageSchema.methods = pageSchema?.methods || {}
  return pageSchema.methods
}

export const getMethodNameList = () => (useCanvas().pageState.pageSchema && Object.keys(getMethods())) || []

export const getMethodContentList = () => Object.values(getMethods()).map((method) => method.value)

const getScriptString = () => {
  const list = Object.entries(getMethods()).map(([name, method]) => insertName(name, method.value))
  const script = list.join(`\n`)
  scriptAst = string2Ast(script)
  return script
}

const change = (value) => {
  state.isChanged = value !== state.script

  if (!monaco.value) {
    return
  }

  // 用户在线编辑代码内容变化时，发起 ESLint 静态检查
  const monacoModel = monaco.value.getEditor().getModel()
  lint(monacoModel, state.linterWorker)
}

export const saveMethod = ({ name, content }) => {
  if (!name) {
    return
  }

  const methods = getMethods()

  if (!methods[name]) {
    methods[name] = {
      type: SCHEMA_DATA_TYPE.JSFunction,
      value: ''
    }
  }

  methods[name].value = content
}

const saveMethods = () => {
  if (!state.isChanged) {
    return false
  }

  if (state.hasError) {
    message({
      status: 'error',
      message: '代码静态检查有错误，请先修改后再保存'
    })

    return false
  }

  const editorContent = monaco.value.getEditor().getValue()
  const ast = string2Ast(editorContent)
  useCanvas().canvasApi.value.getSchema().methods = {}

  ast.program.body.forEach((declaration, index) => {
    const name = declaration?.id?.name

    // 前一个方法的尾部注释和后一个方法的头部注释指向相同引用时，删除尾部注释, 解决注释重复生成问题
    if (
      ast.program.body[index + 1]?.leadingComments &&
      declaration.trailingComments === ast.program.body[index + 1].leadingComments
    ) {
      delete declaration.trailingComments
    }

    const content = formatString(ast2String(declaration).trim(), 'javascript')

    saveMethod({ name, content })
  })
  useCanvas().setSaved(false)
  state.isChanged = false
  useNotify({
    type: 'success',
    message: '保存成功！'
  })

  return true
}

const close = (emit) => (callback) => {
  const callbackFn = isFunction(callback) ? callback : () => emit('close')
  if (!state.isChanged) {
    callbackFn(true)
    return
  }
  confirm({
    title: '提示',
    message: '有改动未保存，您确定保存并关闭吗？',
    exec() {
      callbackFn(saveMethods())
    },
    cancel() {
      callbackFn(true)
    }
  })
}

const setEditorSelection = () => {
  if (!state.editorSelection || !monaco.value) {
    return
  }

  const editor = monaco.value.getEditor()

  editor.setSelection(state.editorSelection)
  editor.focus()

  const top = editor.getTopForLineNumber(state.editorSelection.startLineNumber - 1)

  editor.setScrollPosition(
    {
      scrollLeft: 0,
      scrollTop: top
    },
    0
  )
}

export const highlightMethod = (name) => {
  if (!name) {
    return
  }

  const declarations = scriptAst?.program.body.filter((declaration) => name === declaration?.id?.name)

  if (declarations.length === 0) {
    return
  }

  const loc = declarations[0]?.loc

  if (loc) {
    state.editorSelection = {
      startColumn: loc.start.column,
      startLineNumber: loc.start.line,
      endColumn: loc.end.column + 1,
      endLineNumber: loc.end.line
    }
  }

  if (state.editorSelection) {
    setEditorSelection()
  }
}

export default ({ emit }) => {
  watchEffect(() => {
    state.script = getScriptString()
  })

  onActivated(() => {
    nextTick(() => {
      state.script = getScriptString()
      monaco.value?.focus()
      window.dispatchEvent(new Event('resize'))
    })
  })

  return {
    state,
    monaco,
    change,
    saveMethods,
    close: close(emit)
  }
}
