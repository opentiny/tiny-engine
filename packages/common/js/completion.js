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

const generateBaseReference = () => {
  const { dataSource = [], utils = [], globalState = [] } = useResource().appSchemaState
  const { state, methods } = useCanvas().getPageSchema()
  const currentSchema = useCanvas().getCurrentSchema()
  let referenceContext = `以下是一些通用的协议：
  \n常规属性如：{ width: '300px' }
  \n1.变量引用
  \n{ width: { type: 'JSExpression', value: 'this.state.xxx' }}
  \n即当type为JSExpression，取其value并将value的值当做变量调用
  \n2.方法引用
  \n{ onClickNew: { type: 'JSFunction', value: 'function onClickNew() {}' }}
  \n即当type为JSFunction，取其value并将value的值函数调用
  \n以下是一些依赖，调用均以this.开头：\n`
  if (dataSource.length) {
    referenceContext += `数据源是定义的数据模型\nconst dataSource=${JSON.stringify(
      dataSource
    )}\n调用方式为： this.dataSource.xxx\n`
  }
  if (utils.length) {
    referenceContext += `工具类是通用的调用方法或npm依赖
    \nconst utils=${JSON.stringify(utils)}
    \n调用方式为： this.utils.xxx 
    \nutils有两种类型
    \ntype为npm时，读取content内容，可构造如下引用，例如content中package（依赖包名）为@opentiny/vue，destructuring(解构)为true，exportName（导出组件名称）为Notify，实际引用方式是import { Notify } from '@opentiny/vue';
    \ntype为function时，读取content内容，当content.type为JSFunction则将value视为JS方法并调用，其他可参考通用的协议\n`
  }
  if (globalState.length) {
    referenceContext += `全局变量是使用pinia创建的变量\nconst stores=${JSON.stringify(
      globalState
    )}\n调用方式为： this.stores.xxx\n`
  }
  if (Object.keys(state).length) {
    referenceContext += `js变量\nconst state=${JSON.stringify(state)}\n调用方式为： this.state.xxx\n`
  }
  if (Object.keys(methods).length) {
    referenceContext += `js方法\nconst methods=${JSON.stringify(methods)}\n调用方式为： this.xxx\n`
  }
  referenceContext += `以上依赖中没有的，则不能调用，如utils中没有axios，则axios不能使用\n`
  if (currentSchema) {
    referenceContext += `以下是当前选中的组件
    \n${JSON.stringify(currentSchema)}
    \n请理解当前组件，componentName为组件名称，组件均为tinyVue组件，和基本html元素
    \n该对象中的ref属性为vue组件的ref属性，如ref值为testForm，使用方式为this.$('testForm')
    \nprops表示组件的属性，是一个对象，对应vue组件的defineProps和defineEmits中的内容
    \nprops中以on开头的表示其传递的是方法，如onClick，其值可以参考通用协议
    \nprops中没有以on开头的则是普通属性，如onClick，其值中满足type为JSExpression和JSFunction的可以参考通用协议\n`
  }
  return referenceContext
}

const fetchAiInlineCompletion = (codeBeforeCursor, codeAfterCursor) => {
  const referenceContext = generateBaseReference()
  return fetch('https://agent.opentiny.design/api/v1/ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer sk-1234'
    },
    body: JSON.stringify({
      model: 'internvl3-14b',
      messages: [
        {
          role: 'user',
          content: `你是一个JavaScript代码补全器，可以使用JS和ES的语法
          \n${referenceContext}
          \n直接上下文如下：
          \n${codeBeforeCursor}<cursor>${codeAfterCursor}
          \n请从<cursor>（光标位置）处进行补全
          \n返回代码不要包含上下文代码，不需要多余代码，注意如果是函数时，须以这种格式：function xxx() {}
          \n如果有多个示例，只选择其中一个，不需要返回思考过程和解释`
        }
      ],
      stream: false
    })
  })
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

  return ['javascript', 'typescript']
    .map((lang) => monacoInstance.languages.registerCompletionItemProvider(lang, completionItemProvider))
    .concat(initInlineCompletion(monacoInstance, editorModel))
}
