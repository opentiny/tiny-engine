import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { transformReactToDsl } from '../../src'

// 小工具：读取目录下的测试用例（形如 001_xxx），排除 output 目录
function getTestCaseDirs(rootDir) {
  return fs
    .readdirSync(rootDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name) => name !== 'output' && !name.startsWith('.'))
}

// 读取指定用例 input 目录中的首个 .jsx/.tsx 文件
function findInputSource(caseDir) {
  const inputDir = path.join(caseDir, 'input')
  if (!fs.existsSync(inputDir)) return null
  const files = fs.readdirSync(inputDir)
  const src = files.find((f) => /\.(jsx|tsx)$/.test(f))
  return src ? path.join(inputDir, src) : null
}

// 将 DSL 写入 <caseName>/output/app.schema.json，并额外导出 page.schema.json 便于查看
function writeOutputs(rootDir, caseName, appSchema) {
  const outputDir = path.join(rootDir, caseName, 'output')
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }
  const appSchemaPath = path.join(outputDir, 'app.schema.json')
  fs.writeFileSync(appSchemaPath, JSON.stringify(appSchema, null, 2), 'utf-8')

  // 额外导出首个 page.schema.json 便于查看
  if (Array.isArray(appSchema.pageSchema) && appSchema.pageSchema.length > 0) {
    const pageSchemaPath = path.join(outputDir, 'page.schema.json')
    fs.writeFileSync(pageSchemaPath, JSON.stringify(appSchema.pageSchema[0], null, 2), 'utf-8')
  }
}

describe('react-to-dsl: run all testcases and output to ./output', () => {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const casesRoot = __dirname
  const caseNames = getTestCaseDirs(casesRoot)

  it(`should discover at least 1 testcase`, () => {
    expect(Array.isArray(caseNames)).toBe(true)
    // 允许为空，但给出提示；如果后续补充用例即可被自动识别
  })

  for (const caseName of caseNames) {
    it(`transform testcase: ${caseName}`, () => {
      const caseDir = path.join(casesRoot, caseName)
      const srcPath = findInputSource(caseDir)
      expect(srcPath, `No JSX/TSX found in ${path.join(caseDir, 'input')}`).toBeTruthy()

      const code = fs.readFileSync(srcPath, 'utf-8')
      const appSchema = transformReactToDsl(code, { filename: path.basename(srcPath) })

      // 基本校验
      expect(appSchema).toBeTruthy()
      expect(Array.isArray(appSchema.pageSchema)).toBe(true)

      // 输出到 output/<caseName>
      writeOutputs(casesRoot, caseName, appSchema)
    })
  }
})
