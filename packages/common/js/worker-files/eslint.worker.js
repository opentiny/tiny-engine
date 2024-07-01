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

import { Linter } from 'eslint-linter-browserify'
import eslintRule from '../config-files/eslint-rule'

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
  }
}

const config = {
  ...defaultConfig,
  rules: {
    ...eslintRule,
    // JS 面板中，仅定义 function，但可能不使用该方法
    'no-unused-vars': 'off',
    'no-alert': 'off',
    'no-console': 'off'
  },
  settings: {}
}

// 错误的等级，ESLint 与 monaco 的存在差异，做一层映射
const severityMap = {
  2: 'Error',
  1: 'Warning'
}
const linter = new Linter()

self.addEventListener('message', (event) => {
  const { code, version } = event.data

  const ruleDefines = linter.getRules()
  const errs = linter.verify(code, config)

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
