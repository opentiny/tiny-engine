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

import { parse } from '@vue/compiler-sfc'
import fs from 'fs/promises'

/**
 * 解析Vue SFC代码字符串
 * @param {string} vueCode - Vue SFC代码
 * @returns {Object} 解析结果
 */
export function parseSFC(vueCode) {
  try {
    const { descriptor, errors } = parse(vueCode)

    if (errors && errors.length > 0) {
      // eslint-disable-next-line no-console
      console.warn('SFC parsing warnings:', errors)
    }

    const result = {}

    // 解析模板
    if (descriptor.template) {
      result.template = descriptor.template.content
      result.templateLang = descriptor.template.lang || 'html'
    }

    // 解析脚本 (setup)
    if (descriptor.scriptSetup) {
      result.scriptSetup = descriptor.scriptSetup.content
      result.scriptSetupLang = descriptor.scriptSetup.lang || 'js'
    }

    // 解析脚本 (普通)
    if (descriptor.script) {
      result.script = descriptor.script.content
      result.scriptLang = descriptor.script.lang || 'js'
    }

    // 解析样式
    if (descriptor.styles && descriptor.styles.length > 0) {
      // 合并所有样式块
      result.style = descriptor.styles.map((style) => style.content).join('\n\n')

      result.styleBlocks = descriptor.styles.map((style) => ({
        content: style.content,
        lang: style.lang || 'css',
        scoped: style.scoped || false,
        module: style.module || false
      }))
    }

    // 解析自定义块
    if (descriptor.customBlocks && descriptor.customBlocks.length > 0) {
      result.customBlocks = descriptor.customBlocks.map((block) => ({
        type: block.type,
        content: block.content,
        attrs: block.attrs
      }))
    }

    return result
  } catch (error) {
    throw new Error(`Failed to parse SFC content: ${error.message}`)
  }
}

/**
 * 解析Vue SFC文件
 * @param {string} filePath - Vue文件路径
 * @returns {Promise<Object>} 解析结果
 */
export async function parseVueFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return parseSFC(content)
  } catch (error) {
    throw new Error(`Failed to parse Vue file ${filePath}: ${error.message}`)
  }
}

/**
 * 验证SFC结构
 * @param {Object} sfcResult - SFC解析结果
 * @returns {boolean} 是否有效
 */
export function validateSFC(sfcResult) {
  // 至少需要有模板或脚本
  return !!(sfcResult.template || sfcResult.script || sfcResult.scriptSetup)
}

/**
 * 获取SFC元信息
 * @param {Object} sfcResult - SFC解析结果
 * @returns {Object} 元信息
 */
export function getSFCMeta(sfcResult) {
  return {
    hasTemplate: !!sfcResult.template,
    hasScript: !!sfcResult.script,
    hasScriptSetup: !!sfcResult.scriptSetup,
    hasStyle: !!sfcResult.style,
    templateLang: sfcResult.templateLang,
    scriptLang: sfcResult.scriptLang || sfcResult.scriptSetupLang,
    styleBlocks: sfcResult.styleBlocks || [],
    customBlocks: sfcResult.customBlocks || []
  }
}
