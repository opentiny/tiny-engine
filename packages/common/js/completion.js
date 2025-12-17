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
import { ref } from 'vue'
import { useCanvas, useResource, getMergeMeta, getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'
import completion from './completion-files/context.md?raw'

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
  const { bridge = [], dataSource = [], utils = [], globalState = [] } = useResource().appSchemaState

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

const generateBaseReference = () => {
  const { dataSource = [], utils = [], globalState = [] } = useResource().appSchemaState
  const { state, methods } = useCanvas().getPageSchema()
  const currentSchema = useCanvas().getCurrentSchema()
  let referenceContext = completion
  referenceContext = referenceContext.replace('$dataSource$', JSON.stringify(dataSource))
  referenceContext = referenceContext.replace('$utils$', JSON.stringify(utils))
  referenceContext = referenceContext.replace('$globalState$', JSON.stringify(globalState))
  referenceContext = referenceContext.replace('$state$', JSON.stringify(state))
  referenceContext = referenceContext.replace('$methods$', JSON.stringify(methods))
  referenceContext = referenceContext.replace('$currentSchema$', JSON.stringify(currentSchema))
  return referenceContext
}

const fetchAiInlineCompletion = (codeBeforeCursor, codeAfterCursor) => {
  const { completeModel, apiKey, baseUrl } = getMetaApi(META_SERVICE.Robot).getSelectedQuickModelInfo() || {}
  if (!completeModel || !apiKey || !baseUrl) {
    return
  }
  const referenceContext = generateBaseReference()
  return getMetaApi(META_SERVICE.Http).post(
    '/app-center/api/chat/completions',
    {
      model: completeModel,
      messages: [
        {
          role: 'user',
          content: referenceContext
            .replace('$codeBeforeCursor$', codeBeforeCursor)
            .replace('$codeAfterCursor$', codeAfterCursor)
        }
      ],
      baseUrl,
      stream: false
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey || ''}`
      }
    }
  )
}

const initInlineCompletion = (monacoInstance, editorModel) => {
  const requestAllowed = ref(true)
  const timer = ref()
  const inlineCompletionProvider = {
    provideInlineCompletions(model, position, _context, _token) {
      if (editorModel && model.id !== editorModel.id) {
        return new Promise((resolve) => {
          resolve({ items: [] })
        })
      }

      if (timer.value) {
        clearTimeout(timer.value)
      }

      const words = getWords(model, position)
      const range = getRange(position, words)
      const wordContent = words.map((item) => item.word).join('')
      if (!wordContent || wordContent.lastIndexOf('}') === 0 || wordContent.length < 4) {
        return new Promise((resolve) => {
          resolve({ items: [] })
        })
      }
      if (!requestAllowed.value) {
        return new Promise((resolve) => {
          resolve({
            items: [
              {
                insertText: '',
                range
              }
            ]
          })
        })
      }
      const codeBeforeCursor = model.getValueInRange({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column
      })
      const codeAfterCursor = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: position.column,
        endLineNumber: model.getLineCount(),
        endColumn: model.getLineMaxColumn(model.getLineCount())
      })
      return new Promise((resolve) => {
        // 延迟请求800ms
        timer.value = setTimeout(() => {
          // 节流操作，防止接口一直被请求
          requestAllowed.value = false
          fetchAiInlineCompletion(codeBeforeCursor, codeAfterCursor)
            .then((res) => {
              let insertText = res.choices[0].message.content.trim()
              const wordContentIndex = insertText.indexOf(wordContent)
              if (wordContentIndex === -1) {
                insertText = `${wordContent}${insertText}\n`
              }
              if (wordContentIndex > 0) {
                insertText = insertText.slice(wordContentIndex)
              }
              requestAllowed.value = true
              resolve({
                items: [
                  {
                    insertText,
                    range
                  }
                ]
              })
            })
            .catch(() => {
              requestAllowed.value = true
            })
        }, 800)
      })
    },
    freeInlineCompletions() {}
  }
  return ['javascript', 'typescript'].map((lang) =>
    monacoInstance.languages.registerInlineCompletionsProvider(lang, inlineCompletionProvider)
  )
}

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
  const completions = ['javascript', 'typescript'].map((lang) => {
    return monacoInstance.languages.registerCompletionItemProvider(lang, completionItemProvider)
  })
  const { enableAICompletion } = getMergeMeta('engine.plugins.pagecontroller')?.options || {}
  if (enableAICompletion) {
    return completions.concat(initInlineCompletion(monacoInstance, editorModel))
  }
  return completions
}
