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

import { parse, parseExpression } from '@babel/parser'
import generate from '@babel/generator'
import traverse from '@babel/traverse'
import prettier from 'prettier'
import parserHtml from 'prettier/parser-html'
import parseCss from 'prettier/parser-postcss'
import parserBabel from 'prettier/parser-babel'

const METHOD_REGEXP = /function.*?\(/

export const insertName = (name, content) => content.replace(METHOD_REGEXP, `function ${name}(`)

export const removeName = (content) => content.replace(METHOD_REGEXP, 'function (')

export const string2Ast = (string = '') => parse(string, { sourceType: 'module', plugins: ['typescript', 'jsx'] })

export const ast2String = (ast) => generate(ast, { retainLines: true }).code

const formatScript = (string) => {
  let newStr = string
  const options = {
    parser: 'babel',
    plugins: [parserBabel],
    printWidth: 120,
    singleQuote: true,
    semi: false,
    trailingComma: 'none'
  }
  try {
    // 低码中的编辑器大多只会输入js值，并不是一个完整的javascript表达式，无法格式化，因此需要特殊处理预格式化该种情形
    newStr = prettier.format(`!${string}`, options).substring(1).replace(/\n$/, '')
  } catch (error) {
    newStr = prettier.format(newStr, options)
  }

  return newStr
}

const formatJson = (string) =>
  prettier.format(string, {
    parser: 'json',
    plugins: [parserBabel],
    trailingComma: 'es5',
    tabWidth: 2,
    semi: false,
    singleQuote: true
  })

const formatHtml = (string) =>
  prettier.format(string, {
    parser: 'html',
    plugins: [parserBabel, parserHtml]
  })

const formatCss = (string) =>
  prettier.format(string, {
    parser: 'css',
    plugins: [parseCss]
  })

const formatterMap = {
  json: formatJson,
  typescript: formatScript,
  javascript: formatScript,
  html: formatHtml,
  css: formatCss
}

export const formatString = (str, language) => {
  const formatter = formatterMap[language] || formatJson
  let result = str
  try {
    result = formatter(str)
  } catch (error) {
    const printer = console
    printer.log(error)
  }

  return result
}

export { parse, parseExpression, traverse, generate }

export const includedExpression = (code, expression) => {
  let flag = false
  try {
    traverse(parse(code), {
      ExpressionStatement(path) {
        if (path.toString().includes(expression)) {
          flag = true

          return
        }
      }
    })
  } catch (err) {
    const printer = console
    printer.log(err)
  }

  return flag
}

export const includedExpressionInSchema = (schemaObj, expression) => {
  let hadFlag = false

  const checkReferencedFromSchema = (_schemaObj) => {
    Object.values(_schemaObj).forEach((schemaObjIner) => {
      if (
        ['[object Array]', '[object Object]'].includes(Object.prototype.toString.call(schemaObjIner)) &&
        Object.keys(schemaObjIner).length
      ) {
        if (schemaObjIner.type && ['jsstring', 'JSExpression', 'JSFunction'].includes(schemaObjIner.type)) {
          if (includedExpression(schemaObjIner.value, expression)) {
            hadFlag = true

            return
          }
        } else {
          checkReferencedFromSchema(schemaObjIner)
        }
      }
    })
  }

  checkReferencedFromSchema(schemaObj)

  return hadFlag
}

export const findExpressionInAppSchema = (pageSchemas, expression) => {
  const includedPage = []

  pageSchemas.forEach((pageSchema) => {
    if (includedExpressionInSchema(pageSchema, expression)) {
      includedPage.push(pageSchema.fileName)
    }
  })

  return includedPage
}
