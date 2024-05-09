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

import { useCanvas, useResource } from '@opentiny/tiny-engine-controller'

const keyWords = [
  'state',
  'stores',
  'props',
  'emit',
  'setState',
  'route',
  'i18n',
  'getLocale',
  'setLocale',
  'history',
  'utils',
  'bridge',
  'dataSourceMap'
]

const snippets = [
  {
    lable: 'new function',
    type: 'Function',
    insertText: `function \${1:funName} (\${2}) {
  \${3}
}`,
    detail: 'create new function'
  }
]

const TYPES = {
  KeyWord: 'KeyWord',
  Function: 'Function',
  Method: 'Method',
  Value: 'Value',
  Variable: 'Variable'
}

const getApiSuggestions = (monaco, range, wordContent) =>
  keyWords
    .map((item) => ({
      label: `this.${item}`,
      kind: monaco.languages.CompletionItemKind.Keyword,
      insertText: `this.${item}`,
      detail: `Lowcode API`,
      range
    }))
    .filter(({ insertText }) => insertText.indexOf(wordContent) === 0)

const getSnippetsSuggestions = (monaco, range, wordContent) =>
  snippets
    .map((item) => ({
      label: item.lable,
      insertText: item.insertText,
      detail: item.detail,
      kind: monaco.languages.CompletionItemKind[item.type],
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      range
    }))
    .filter(({ insertText }) => insertText.indexOf(wordContent) === 0)

const getUserWords = () => {
  const { bridge = [], dataSource = [], utils = [], globalState = [] } = useResource().resState

  return {
    state: {
      type: TYPES.Variable,
      getInsertText: (value) => `this.state.${value}`,
      data: Object.keys(useCanvas().getPageSchema().state || {})
    },
    stores: {
      type: TYPES.Variable,
      getInsertText: (value) => `this.stores.${value}`,
      data: globalState
        .filter((item) => item.id)
        .map((item) => [
          item.id,
          ...[...Object.keys(item.state), ...Object.keys(item.getters)].map((name) => `${item.id}.${name}`)
        ])
        .flat()
    },
    storeFn: {
      type: TYPES.Method,
      getInsertText: (value) => `this.stores.${value}()`,
      data: globalState
        .filter((item) => item.id)
        .map((item) => Object.keys(item.actions).map((name) => `${item.id}.${name}`))
        .flat()
    },
    utils: {
      type: TYPES.Variable,
      getInsertText: (value) => `this.utils.${value}`,
      data: utils.map((item) => item.name)
    },
    dataSource: {
      type: TYPES.Method,
      getInsertText: (value) => `this.dataSourceMap.${value}.load()`,
      data: dataSource.map((item) => item.name)
    },
    bridge: {
      type: TYPES.Variable,
      getInsertText: (value) => `this.bridge.${value}`,
      data: bridge.map((item) => item.name)
    }
  }
}

const getUserSuggestions = (monaco, range, wordContent) => {
  const userWords = getUserWords()

  return Object.entries(userWords)
    .map(([_itemKey, itemContent]) =>
      itemContent.data.map((item) => ({
        kind: monaco.languages.CompletionItemKind[itemContent.type],
        label: itemContent.getInsertText(item),
        insertText: itemContent.getInsertText(item),
        detail: `Lowcode API`,
        range
      }))
    )
    .flat()
    .filter(({ insertText }) => insertText.indexOf(wordContent) === 0)
}

const getCurrentChar = (model, position) => {
  const currentChar = model.getValueInRange({
    startLineNumber: position.lineNumber,
    endLineNumber: position.lineNumber,
    startColumn: position.column - 1,
    endColumn: position.column
  })

  return { word: currentChar, startColumn: position.column - 1, endColumn: position.column }
}

const getWords = (model, position) => {
  const words = []

  const currentWord = model.getWordUntilPosition(position).word
    ? model.getWordAtPosition(position)
    : getCurrentChar(model, position)
  words.push(currentWord)

  const lastPosition = { ...position, column: currentWord.startColumn }
  while (lastPosition.column > 1) {
    const lastWord = model.getWordUntilPosition(lastPosition).word
      ? model.getWordUntilPosition(lastPosition)
      : getCurrentChar(model, lastPosition)
    if (!/[\w.]/.test(lastWord.word)) break
    words.push(lastWord)
    lastPosition.column = lastWord.startColumn
  }

  return words.reverse()
}

const getRange = (position, words) => ({
  startLineNumber: position.lineNumber,
  endLineNumber: position.lineNumber,
  startColumn: words[0].startColumn,
  endColumn: words[words.length - 1].endColumn
})

export const initCompletion = (monacoInstance, editorModel, conditionFn) => {
  const completionItemProvider = {
    provideCompletionItems(model, position, _context, _token) {
      if (editorModel && model.id !== editorModel.id) {
        return {
          suggestions: []
        }
      }
      const words = getWords(model, position)
      const wordContent = words.map((item) => item.word).join('')
      const range = getRange(position, words)

      // 内置 API 提示 e.g. this.state/props/utils/...
      const apiSuggestions = getApiSuggestions(monacoInstance, range, wordContent)
      // 代码片段提示 e.g.  create new function
      const snippetSuggestions = getSnippetsSuggestions(monacoInstance, range, wordContent)
      // 用户变量数据提示 e.g. this.dataSourceMap.xxx.load()
      const userSuggestions = getUserSuggestions(monacoInstance, range, wordContent)
      return {
        suggestions: [...apiSuggestions, ...snippetSuggestions, ...userSuggestions].filter((item) =>
          conditionFn ? conditionFn(item) : true
        )
      }
    },
    triggerCharacters: ['.']
  }

  return ['javascript', 'typescript'].map((lang) =>
    monacoInstance.languages.registerCompletionItemProvider(lang, completionItemProvider)
  )
}
