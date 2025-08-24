import { describe, expect, test } from 'vitest'
import fs from 'fs'
import path from 'path'
import { generateCode } from '../../src/generator/page'
const { ESLint } = require('eslint')

const fullDir = __dirname
const config = require('./index.config.js')

import { formatCode } from '../../src/utils/formatCode'

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, 'utf-8'))
}

function getPageData(testCaseFile) {
  const inputDir = path.join(fullDir, testCaseFile.name, 'input')
  const pageSchema = readJSON(path.join(inputDir, 'page.schema.json'))
  let blocksData = []
  let componentsMap = []
  if (fs.existsSync(path.join(inputDir, 'blocks.schema.json'))) {
    blocksData = readJSON(path.join(inputDir, 'blocks.schema.json'))
  }
  if (fs.existsSync(path.join(inputDir, 'components-map.json'))) {
    componentsMap = readJSON(path.join(inputDir, 'components-map.json'))
  }
  return {
    pageInfo: { schema: pageSchema, name: testCaseFile.pageName || 'page1' },
    componentsMap,
    blocksData,
    pageSchema
  }
}

async function lintFile(filePath) {
  const eslint = new ESLint({ fix: false })
  const results = await eslint.lintFiles([filePath])
  return results
}

describe('页面生成（jsx+css）', () => {
  for (const testCaseFile of config.cases) {
    test(`${testCaseFile.name} 页面生成`, async () => {
      const { pageInfo, componentsMap, blocksData, pageSchema } = getPageData(testCaseFile)
      const outputDir = path.join(fullDir, testCaseFile.name, 'output')
      const result = generateCode({ pageInfo, componentsMap, blocksData })
      // 只校验 jsx 和 css 文件内容
      const jsxFile = result.find((i) => i.panelName.endsWith('.jsx'))
      const cssFile = result.find((i) => i.panelName.endsWith('.css'))
      expect(jsxFile).toBeTruthy()
      expect(cssFile).toBeTruthy()
      expect(jsxFile.panelValue).toMatch(/(const|function)\s+\w+/)
      if (pageSchema.css && pageSchema.css.trim()) {
        expect(cssFile.panelValue).toMatch(/\.[\w-]+\s*\{/)
      } else {
        expect(cssFile.panelValue).toBe('')
      }
      // 输出到 output 目录
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
      }
      const jsxPath = path.join(outputDir, jsxFile.panelName)

      // 格式化 jsx 代码
      const formattedJsxCode = formatCode(jsxFile.panelValue, jsxFile.panelName)
      fs.writeFileSync(jsxPath, formattedJsxCode, 'utf-8')

      // 格式化 css 代码
      const formattedCssCode = formatCode(cssFile.panelValue, cssFile.panelName)
      fs.writeFileSync(path.join(outputDir, cssFile.panelName), formattedCssCode, 'utf-8')

      // 去除样式导入，仅校验 JS/JSX 代码
      const jsxCodeForLint = jsxFile.panelValue.replace(/^import\s+['\"].+\.css['\"];?$/gm, '')

      // ESLint 校验
      const lintResults = await lintFile(jsxPath)
      const errors = lintResults.flatMap((r) => r.messages)
      if (errors.length > 0) {
        const errorMsg = errors.map((e) => `${e.line}:${e.column} ${e.message} (${e.ruleId})`).join('\n')
        throw new Error(`ESLint 校验未通过:\n${errorMsg}`)
      }
    })
  }
})
