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
import prettierConfig from './config-files/prettierrc'

type PrettierOptions = prettier.Options & {
  [key: string]: unknown
}

const METHOD_REGEXP = /function.*?\(/
const basePrettierConfig = prettierConfig as PrettierOptions // 统一断言 prettier 配置，便于后续复用

export const insertName = (name: string, content: string) => content.replace(METHOD_REGEXP, `function ${name}(`) // 简单给函数补名字，避免匿名
export const removeName = (content: string) => content.replace(METHOD_REGEXP, 'function (') // 移除函数名，维持匿名状态

type BabelAst = ReturnType<typeof parse>
type GeneratorInput = Parameters<typeof generate>[0]

export const string2Ast = (string = ''): BabelAst =>
  parse(string, { sourceType: 'module', plugins: ['typescript', 'jsx'] }) // 先解析成 Babel AST 方便后续处理

export const ast2String = (ast: GeneratorInput): string => generate(ast, { retainLines: true }).code // 将 AST 再转回字符串

type FormatterFn = (input: string) => string
type SupportedLanguage = 'json' | 'typescript' | 'javascript' | 'html' | 'css' | 'vue' | 'less'
type SupportedPrettierParser = 'json' | 'babel' | 'babel-ts' | 'html' | 'css' | 'less' | 'vue'

const PRETTIER_PLUGINS = [parserBabel, parseCss, parserHtml]

const formatWithParser = (string: string, parser: SupportedPrettierParser, options: PrettierOptions = {}): string =>
  prettier.format(string, {
    parser,
    plugins: PRETTIER_PLUGINS,
    ...basePrettierConfig,
    ...options
  })

const formatScript = (string: string, parser: 'babel' | 'babel-ts' = 'babel'): string => {
  let newStr = string
  const options: PrettierOptions = {
    parser,
    plugins: [parserBabel],
    ...basePrettierConfig
  }
  try {
    const ast = string2Ast(string)
    // javascript 在 prettier 格式化的时候，会自动在前面加上逗号“；”，因此该种情形需要特殊处理格式化
    if (ast.program.body?.length === 1 && ast.program.body?.[0]?.type === 'ExpressionStatement') {
      // 将 javascript 表达式 包裹在 "!()" 中，格式化完成之后，再从里面取出来格式化之后的值
      newStr = prettier.format(`!(${string})`, options).replace(/\r?\n$/, '')

      // 格式化后，仍存在包裹的 "!()"
      if (newStr.match(/^!\([\s\S]*\)$/)) {
        newStr = newStr.replace(/^!\(([\s\S]*)\)$/, '$1')
      } else {
        // 格式化后，仅存在开头的 "!"
        newStr = newStr.replace(/^!/, '')
      }
    } else {
      // 其他类型，不需要特殊处理
      newStr = prettier.format(string, options)
    }
  } catch (error) {
    newStr = prettier.format(newStr, options)
  }

  return newStr
}

const formatJson: FormatterFn = (string) => formatWithParser(string, 'json')

const formatHtml: FormatterFn = (string) => formatWithParser(string, 'html')

const formatCss: FormatterFn = (string) => formatWithParser(string, 'css')

const formatVue: FormatterFn = (string) => formatWithParser(string, 'vue')

const formatLess: FormatterFn = (string) => formatWithParser(string, 'less')

const formatterMap: Record<SupportedLanguage, FormatterFn> = {
  json: formatJson,
  typescript: (str) => formatScript(str, 'babel-ts'),
  javascript: formatScript,
  html: formatHtml,
  css: formatCss,
  vue: formatVue,
  less: formatLess
}

const parserMap: Record<string, SupportedPrettierParser> = {
  json: 'json',
  js: 'babel',
  jsx: 'babel',
  mjs: 'babel',
  cjs: 'babel',
  ts: 'babel-ts',
  tsx: 'babel-ts',
  css: 'css',
  less: 'less',
  html: 'html',
  vue: 'vue'
}

export const getPrettierParserByFileName = (fileName = ''): SupportedPrettierParser | undefined => {
  const pureFileName = fileName.split('?')[0].split('#')[0].toLowerCase()
  const extension = pureFileName.split('.').at(-1)

  if (!extension || extension === pureFileName) {
    return undefined
  }

  return parserMap[extension]
}

export const formatString = (str: string, language: string): string => {
  const formatter = (formatterMap[language as SupportedLanguage] ?? formatJson) as FormatterFn // 若语言不在列表内，默认走 JSON 格式化兜底
  let result = str
  try {
    result = formatter(str)
  } catch (error) {
    const printer: Console = console
    printer.log(error)
  }

  return result
}

export const formatStringByFileName = (str: string, fileName: string): string => {
  const parser = getPrettierParserByFileName(fileName)

  if (!parser) {
    return str
  }

  try {
    if (parser === 'babel' || parser === 'babel-ts') {
      return formatScript(str, parser)
    }

    return formatWithParser(str, parser)
  } catch (error) {
    const printer: Console = console
    printer.log(error)

    return str
  }
}

export { parse, parseExpression, traverse, generate }

export const includedExpression = (code: string, expression: string): boolean => {
  let flag = false
  try {
    traverse(parse(code), {
      ExpressionStatement(path: { toString(): string }) {
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

type SchemaPrimitive = string | number | boolean | null // Schema 列表中的原子类型
interface SchemaExpressionNode {
  type?: string
  value?: string
  [key: string]: SchemaValue | undefined
}
type SchemaValue = SchemaPrimitive | SchemaExpressionNode | SchemaValue[] | { [key: string]: SchemaValue }

export const includedExpressionInSchema = (schemaObj: SchemaValue, expression: string): boolean => {
  let hadFlag = false

  // 递归扫描 schema，定位 JS 表达式引用
  const checkReferencedFromSchema = (_schemaObj: SchemaValue): void => {
    if (Array.isArray(_schemaObj)) {
      _schemaObj.forEach((schemaItem) => {
        if (!hadFlag) {
          checkReferencedFromSchema(schemaItem)
        }
      })

      return
    }

    if (_schemaObj && typeof _schemaObj === 'object') {
      const schemaRecord = _schemaObj as SchemaExpressionNode
      if (
        schemaRecord.type &&
        ['jsstring', 'JSExpression', 'JSFunction'].includes(schemaRecord.type) &&
        typeof schemaRecord.value === 'string'
      ) {
        if (includedExpression(schemaRecord.value, expression)) {
          hadFlag = true

          return
        }
      }

      Object.values(schemaRecord).forEach((innerSchema) => {
        if (!hadFlag && innerSchema !== undefined) {
          checkReferencedFromSchema(innerSchema)
        }
      })
    }
  }

  checkReferencedFromSchema(schemaObj)

  return hadFlag
}

interface PageSchema {
  fileName: string
  [key: string]: SchemaValue
}

export const findExpressionInAppSchema = (pageSchemas: PageSchema[], expression: string): string[] => {
  const includedPage: string[] = []

  pageSchemas.forEach((pageSchema) => {
    if (includedExpressionInSchema(pageSchema, expression)) {
      includedPage.push(pageSchema.fileName)
    }
  })

  return includedPage
}
