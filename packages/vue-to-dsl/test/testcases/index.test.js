import { describe, it, expect } from 'vitest'
import { VueToDslConverter } from '../../src/converter'
import fs from 'fs'
import path from 'path'

describe('VueToDslConverter testcases', () => {
  const baseDir = path.resolve(__dirname, '.')
  const converter = new VueToDslConverter()

  const cases = fs.readdirSync(baseDir).filter((name) => /\d+_/.test(name))

  cases.forEach((caseName) => {
    const caseDir = path.join(baseDir, caseName)
    const inputFile = path.join(caseDir, 'input', 'component.vue')
    const expectFile = path.join(caseDir, 'expected', 'schema.json')

    it(`case ${caseName} should convert correctly`, async () => {
      const result = await converter.convertFromFile(inputFile)
      const expected = JSON.parse(fs.readFileSync(expectFile, 'utf-8'))

      // 保存到output目录
      const outputFile = path.join(caseDir, 'output', 'schema.json')
      fs.mkdirSync(path.dirname(outputFile), { recursive: true })
      fs.writeFileSync(outputFile, JSON.stringify(result.schema, null, 2))

      // helper: deep clean (remove dynamic keys like meta / id)
      const deepClean = (val) => {
        if (Array.isArray(val)) {
          return val.map((v) => deepClean(v))
        }
        if (val && typeof val === 'object') {
          const out = {}
          Object.keys(val).forEach((k) => {
            if (k === 'meta' || k === 'id') return
            out[k] = deepClean(val[k])
          })
          return out
        }
        return val
      }

      // helper: expect actual to be a superset of expected (subset match)
      const expectSubset = (actual, exp) => {
        if (Array.isArray(exp)) {
          expect(Array.isArray(actual)).toBe(true)
          // Only check the first N items where N = exp.length
          for (let i = 0; i < exp.length; i++) {
            expectSubset(actual[i], exp[i])
          }
          return
        }
        if (exp && typeof exp === 'object') {
          expect(actual && typeof actual === 'object').toBe(true)
          Object.keys(exp).forEach((k) => {
            expectSubset(actual[k], exp[k])
          })
          return
        }
        // primitives
        expect(actual).toEqual(exp)
      }

      if (expected.error) {
        expect(result.errors.length).toBeGreaterThan(0)
        // 允许部分 schema 存在
        expect(result.schema).not.toBeUndefined()
      } else {
        expect(result.errors).toHaveLength(0)
        expect(result.schema).toBeDefined()
        const actualClean = deepClean(result.schema)
        const expectedClean = deepClean(expected)
        // 进行部分匹配断言（忽略 meta/id 且仅要求包含期望结构）
        expectSubset(actualClean, expectedClean)
      }
    })
  })
})
