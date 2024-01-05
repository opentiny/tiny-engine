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

// importScripts 不支持 esm (safari不支持), 此处使用 umd，脚本地址参考vite.config.js的静态拷贝配置
importScripts('./linter.js')

importScripts('./eslint-rules/eslint-recommended.js')
importScripts('./eslint-rules/eslint-all.js')

const defaultConfig = {
  env: {
    browser: true,
    es6: true
  },
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rulesPreset: {
    recommended: eslintRecommended.rules,
    all: eslintAll.rules
  }
}

// 内置了eslintRecommended, 可以进一步定制
const getConfig = (style) => ({
  ...defaultConfig,
  rules: {
    ...defaultConfig.rulesPreset[style || 'recommended'],
    // JS 面板中，仅定义 function，但可能不使用该方法
    'no-unused-vars': 'off',
    'no-alert': 'off',
    'no-console': 'off'
  },
  settings: {}
})

const getCustomConfig = (rulesObjectStr) => {
  let rules
  try {
    rules = JSON.parse(rulesObjectStr)
  } catch (e) {
    rules = {}
    const logger = console
    logger.warn('Failed to parse custom rules')
  }
  return {
    ...defaultConfig,
    rules: {
      // JS 面板中，仅定义 function，但可能不使用该方法
      'no-unused-vars': 'off',
      'no-alert': 'off',
      'no-console': 'off',
      ...rules
    },
    settings: {}
  }
}

// 错误的等级，ESLint 与 monaco 的存在差异，做一层映射
const severityMap = {
  2: 'Error',
  1: 'Warning'
}
const linter = new self.eslint.Linter()

self.addEventListener('message', (event) => {
  const { code, version, style, customRules } = event.data

  const ruleDefines = linter.getRules()
  const errs = linter.verify(code, style === 'custom' ? getCustomConfig(customRules) : getConfig(style))

  const markers = errs.map(({ ruleId = '', line, endLine, column, endColumn, message, severity }) => ({
    code: {
      value: ruleId || '',
      target: ruleDefines.get(ruleId)?.meta?.docs?.url || ''
    },
    startLineNumber: line,
    endLineNumber: endLine,
    startColumn: column,
    endColumn: endColumn,
    message: message,
    severity: severityMap[severity],
    source: 'ESLint'
  }))

  // ESLint 静态检查结果，发回主线程
  self.postMessage({ markers, version })
})
