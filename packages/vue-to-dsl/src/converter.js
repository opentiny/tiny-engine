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

import { parseSFC } from './parser/index.js'
import { parseTemplate } from './parsers/templateParser.js'
import { parseScript } from './parsers/scriptParser.js'
import { parseStyle } from './parsers/styleParser.js'
import { generateSchema } from './generator/index.js'
import fs from 'fs/promises'
import path from 'path'

export class VueToDslConverter {
  constructor(options = {}) {
    this.options = {
      componentMap: {},
      preserveComments: false,
      strictMode: false,
      customParsers: {},
      ...options
    }
  }

  /**
   * 将Vue SFC文件内容转换为DSL Schema
   * @param {string} vueCode - Vue SFC文件内容
   * @returns {Promise<ConvertResult>}
   */
  async convertFromString(vueCode) {
    const errors = []
    const warnings = []
    const dependencies = []

    try {
      // 1. 解析SFC结构
      const sfcResult = parseSFC(vueCode)

      if (!sfcResult.template && !sfcResult.scriptSetup && !sfcResult.script) {
        throw new Error('Invalid Vue SFC: no template or script found')
      }

      // 2. 解析各个部分
      let templateSchema = []
      let scriptSchema = {}
      let styleSchema = {}

      // 解析模板
      if (sfcResult.template) {
        try {
          templateSchema = this.options.customParsers.template
            ? this.options.customParsers.template.parse(sfcResult.template)
            : parseTemplate(sfcResult.template, this.options)
        } catch (error) {
          errors.push(`Template parsing error: ${error.message}`)
          if (this.options.strictMode) throw error
        }
      }

      // 解析脚本
      const scriptContent = sfcResult.scriptSetup || sfcResult.script
      if (scriptContent) {
        try {
          scriptSchema = this.options.customParsers.script
            ? this.options.customParsers.script.parse(scriptContent)
            : parseScript(scriptContent, {
                isSetup: !!sfcResult.scriptSetup,
                ...this.options
              })

          // 收集依赖
          if (scriptSchema.imports) {
            dependencies.push(...scriptSchema.imports.map((imp) => imp.source))
          }
        } catch (error) {
          errors.push(`Script parsing error: ${error.message}`)
          if (this.options.strictMode) throw error
        }
      }

      // 解析样式
      if (sfcResult.style) {
        try {
          styleSchema = this.options.customParsers.style
            ? this.options.customParsers.style.parse(sfcResult.style)
            : parseStyle(sfcResult.style, this.options)
        } catch (error) {
          errors.push(`Style parsing error: ${error.message}`)
          if (this.options.strictMode) throw error
        }
      }

      // 3. 生成最终Schema
      const schema = await generateSchema(templateSchema, scriptSchema, styleSchema, this.options)

      return {
        schema,
        dependencies: [...new Set(dependencies)], // 去重
        errors,
        warnings
      }
    } catch (error) {
      errors.push(`Conversion error: ${error.message}`)

      return {
        schema: null,
        dependencies: [],
        errors,
        warnings
      }
    }
  }

  /**
   * 将Vue SFC文件转换为DSL Schema
   * @param {string} filePath - Vue文件路径
   * @returns {Promise<ConvertResult>}
   */
  async convertFromFile(filePath) {
    try {
      const vueCode = await fs.readFile(filePath, 'utf-8')
      const result = await this.convertFromString(vueCode)

      // 从文件路径提取文件名和路径信息
      const fileName = path.basename(filePath, '.vue')
      const relativePath = path.dirname(filePath)

      if (result.schema) {
        result.schema.fileName = fileName
        result.schema.path = relativePath
      }

      return result
    } catch (error) {
      return {
        schema: null,
        dependencies: [],
        errors: [`File reading error: ${error.message}`],
        warnings: []
      }
    }
  }

  /**
   * 批量转换多个Vue文件
   * @param {string[]} filePaths - Vue文件路径数组
   * @returns {Promise<ConvertResult[]>}
   */
  async convertMultipleFiles(filePaths) {
    const results = []

    for (const filePath of filePaths) {
      try {
        const result = await this.convertFromFile(filePath)
        results.push(result)
      } catch (error) {
        results.push({
          schema: null,
          dependencies: [],
          errors: [`Failed to convert ${filePath}: ${error.message}`],
          warnings: []
        })
      }
    }

    return results
  }

  /**
   * 设置选项
   * @param {VueToSchemaOptions} options
   */
  setOptions(options) {
    this.options = { ...this.options, ...options }
  }

  /**
   * 获取当前选项
   * @returns {VueToSchemaOptions}
   */
  getOptions() {
    return { ...this.options }
  }
}
