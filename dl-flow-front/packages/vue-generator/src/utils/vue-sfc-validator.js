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

import { parse as parseSFC, compileScript, compileStyle, compileTemplate } from '@vue/compiler-sfc'
import { generateCodeFrame } from '@vue/shared'
import { randomString } from '.'

/**
 * 使用 vue-eslint-parser，校验 vue sfc 是否有效
 * @param {string} code 源码
 * @returns {Error[]} 校验出的报错信息
 */
export function validateByParse(code) {
  const { parse: parseVue } = require('vue-eslint-parser')
  let errors = []

  try {
    const { templateBody, errors: parseErrors } = parseVue(code, {
      ecmaVersion: 'latest',
      sourceType: 'module',
      ecmaFeatures: {
        jsx: true
      }
    })
    errors = templateBody?.errors || parseErrors || []
  } catch (error) {
    // 此处可捕获到 SyntaxError，如：嵌套双引号未转义的问题
    errors.push(unify(error))
  }

  return errors.map(({ message, lineNumber: line, column }) => {
    if (line && column) {
      return locateErrorMessage(code, { message, loc: { start: { line, column } } })
    }

    return { message }
  })
}

/**
 * 使用 @vue/compiler-sfc， 校验 vue sfc 是否有效
 * @param {string} filename 文件名称
 * @param {string} code 源码
 * @returns {Error[]} 校验出的错误信息
 */
export function validateByCompile(filename, code) {
  // validate via parse
  const { errors, descriptor } = parseSFC(code, {
    filename,
    sourceMap: false
  })

  if (errors.length) {
    return errors.map((error) => locateErrorMessage(code, error))
  }

  const id = randomString()

  // validate via compile script
  let bindingMetadata
  try {
    const scriptResult = compileScript(descriptor, { id })
    bindingMetadata = scriptResult.bindings
  } catch (error) {
    // error 可能的类型 string | ParseError (@babel/parser) | CompilerError (compileScript 使用 inlineTemplate 模式时)
    const scriptError = unify(error)

    // 如果是 ParseError 类型，转换为 locateErrorMessage 可接受的 CompilerError 类型传入
    if (!scriptError?.loc?.start && scriptError?.loc?.line) {
      // 只截取原 message 的第一行，后面行数可能已经包含错误的定位信息，避免拼接重复
      const message = scriptError.message.match(/.*/)[0]
      const { line, column } = scriptError.loc

      // compileScript 内部抛错误时，可能已定位编译报错信息，但报错所在的行可能有大量字符，此处精简一下
      return [locateErrorMessage(code, { message, loc: { start: { line, column } } })]
    }

    return [{ message: scriptError.message }]
  }

  // validate via compile template
  const { styles, template, slotted } = descriptor
  const scoped = styles.some((s) => s.scoped)

  const templateResult = compileTemplate({
    source: template.content,
    filename,
    id,
    scoped,
    slotted,
    compilerOptions: { bindingMetadata }
  })

  if (templateResult.errors.length) {
    return templateResult.errors.map(unify).map((error) => locateErrorMessage(code, error))
  }

  // validate via compile style
  // 目前暂时没有预处理器，如：less
  const stylesResult = styles.map(({ content, module }) =>
    compileStyle({ source: content, filename, id, scoped, modules: Boolean(module) })
  )
  const errorsInStyles = stylesResult
    .filter(({ errors }) => errors.length)
    .map(({ errors }) => errors)
    .flat()

  return errorsInStyles
}

/**
 * 统一报错的格式
 * @param {(string | Error)} error 原始错误信息
 * @returns {Error} 统一格式后的错误信息
 */
function unify(error) {
  if (typeof error === 'string') {
    return { message: error }
  }

  return error
}

/**
 * 定位报错信息，如果包含报错位置，则追加到 message 中输出
 * @param {string} originalSource 原始代码
 * @param {(Error | CompilerError)} error 错误信息
 * @returns {{message: string}} 可能包含报错位置的错误信息
 */
function locateErrorMessage(originalSource, error) {
  let { loc, message } = error

  if (loc?.start) {
    const { line, column } = loc.start
    const errorLineCode = originalSource.split(/\r?\n/)[line - 1]

    // 源码字符串未经格式化，报错所在的行可能有大量字符，截取报错位置附近范围的错误信息，比如：前后 50 字符内
    const SCOPE = 50
    const scopeStartIndex = Math.max(0, column - SCOPE)
    const scopeCode = errorLineCode.slice(scopeStartIndex, column + SCOPE)

    message = `${message} \n ${generateCodeFrame(scopeCode, column - scopeStartIndex)}`
  }

  return { message }
}
