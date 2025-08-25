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
import { useCanvas, useResource } from '@opentiny/tiny-engine-meta-register'

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

const fetchAiInlineCompletion = (wordContent, signal) => {
  const { dataSource = [], utils = [], globalState = [] } = useResource().appSchemaState
  const { state, methods } = useCanvas().getPageSchema()
  const currentSchema = useCanvas().getCurrentSchema()
  const context =
    `const state=${
      JSON.stringify(state) || '{}'
    } // 请将其理解为js对象，使用方式如： this.state.xxx, 属于页面全局变量，不要作为入参或出参使用\nconst stores=${JSON.stringify(
      globalState
    )} // 请将其理解为pinia对象，使用方式如： this.stores.xxx, 属于应用全局变量，不要作为入参或出参使用\nconst dataSource=${JSON.stringify(
      dataSource
    )} // 请将其理解为js对象，使用方式如： this.dataSource.xxx, 属于页面全局变量，不要作为入参或出参使用\nconst utils=${JSON.stringify(
      utils
    )} // 请将其理解为js对象，使用方式如： this.utils.xxx, 属于页面全局变量，不要作为入参或出参使用\nconst methods=${JSON.stringify(
      methods
    )} // 请将其理解为js对象，使用方式如： this.xxx，type为JSFunction表示他的类型是function，实际方法体为其value, 属于页面全局变量，不要作为入参或出参使用\n\n当前选中组件上下文\n${JSON.stringify(
      currentSchema
    )}\n 请理解当前组件，componentName为组件名称，组件均为vue组件\nref为vue3组件的ref属性，使用方式为this.$('xxx')\nprops为其属性，是一个对象，将其理解为vue3组件的props及传递的事件\n` +
    `其中普通属性不以on开头，且如果其type为JSExpression表示绑定了变量，例如this.state.xxx，则从state上下文取值，其他同理\n` +
    `其中属性以on开头的表示为绑定事件，绑定事件如果type为JSExpression，那么其value的this.xxx表示从methods上下文中读取对应方法,如果type为JSFunction，实际方法体为其value`
  return fetch('https://agent.opentiny.design/api/v1/ai/chat/completions', {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer sk-trial'
    },
    body: JSON.stringify({
      model: 'deepseek-ai/Deepseek-V3',
      messages: [
        {
          role: 'user',
          content: `你是一个JavaScript或TypeScript代码补全器，以下是我的上下文：\n${context}\n，关键字如下：\n${wordContent}\n请帮我进行补全，紧跟着关键字进行补全，不需要多余代码，注意创建方法时，须以这种格式：function xxx() {}\n如果有多个示例，只选择其中一个，只需要返回对应的逻辑正确的纯粹代码，只返回纯粹代码，不需要返回思考过程和解释`
        }
      ],
      stream: false
    })
  })
}

const initInlineCompletion = (monacoInstance, editorModel) => {
  const controller = ref(new AbortController())
  const signal = ref(controller.value.signal)
  const requestAllowed = ref(true)
  const timer = ref()
  const inlineCompletionProvider = {
    provideInlineCompletions(model, position, _context, _token) {
      if (editorModel && model.id !== editorModel.id) {
        return null
      }

      if (timer.value) {
        clearTimeout(timer.value)
      }

      const words = getWords(model, position)
      const range = getRange(position, words)
      const wordContent = words.map((item) => item.word).join('')
      if (!wordContent || wordContent.lastIndexOf('}') === 0) {
        return null
      }
      // 如果是第二次请求，则中断当前未完成的请求
      if (controller.value && !requestAllowed.value) {
        controller.value.abort()
      }
      // 如果请求被中断后，重新设置AbortController
      if (!controller.value || signal.value.aborted) {
        controller.value = new AbortController()
        signal.value = controller.value.signal
      }
      requestAllowed.value = false
      return new Promise((resolve) => {
        // 防抖操作，延迟请求800ms
        timer.value = setTimeout(() => {
          fetchAiInlineCompletion(wordContent, signal.value)
            .then((response) => response.json())
            .then((res) => {
              let insertText = res.choices[0].message.content
                .replace(/.*\n/, '')
                .replaceAll('```', '')
                .replace('javascript', '')
                .replace('typescript', '')
                .trim()
              const wordContentIndex = insertText.indexOf(wordContent)
              if (wordContentIndex === -1) {
                insertText = `${wordContent}\n${insertText}`
              }
              if (wordContentIndex > 0) {
                insertText = insertText.slice(wordContentIndex)
              }
              requestAllowed.value = true
              resolve({
                items: [
                  {
                    label: wordContent,
                    text: wordContent,
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
    freeInlineCompletions(completions) {
      completions.items = []
    }
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

  return ['javascript', 'typescript']
    .map((lang) => monacoInstance.languages.registerCompletionItemProvider(lang, completionItemProvider))
    .concat(initInlineCompletion(monacoInstance, editorModel))
}
