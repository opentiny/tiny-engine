import { describe, it, expect } from 'vitest'
import { VueToDslConverter } from '../../src/converter.js'
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
      const vueCode = fs.readFileSync(inputFile, 'utf-8')
      const expected = JSON.parse(fs.readFileSync(expectFile, 'utf-8'))

      const result = await converter.convertFromString(vueCode)

      // 保存到output目录
      const outputFile = path.join(caseDir, 'output', 'schema.json')
      fs.mkdirSync(path.dirname(outputFile), { recursive: true })
      fs.writeFileSync(outputFile, JSON.stringify(result.schema, null, 2))

      if (expected.error) {
        expect(result.errors.length).toBeGreaterThan(0)
        // 允许部分 schema 存在
        expect(result.schema).not.toBeUndefined()
      } else {
        expect(result.errors).toHaveLength(0)
        expect(result.schema).toBeDefined()
        // 基本结构断言
        Object.keys(expected).forEach((key) => {
          if (key === 'methods') {
            Object.keys(expected.methods).forEach((m) => {
              expect(result.schema.methods[m]).toBeDefined()
            })
          } else if (key === 'state') {
            Object.keys(expected.state).forEach((s) => {
              expect(result.schema.state[s]).toBeDefined()
            })
          } else if (key === 'computed') {
            if (expected.computed) {
              Object.keys(expected.computed).forEach((c) => {
                expect(result.schema.computed[c]).toBeDefined()
              })
            }
          } else if (key === 'lifecycle') {
            if (expected.lifecycle) {
              Object.keys(expected.lifecycle).forEach((l) => {
                expect(result.schema.lifecycle[l]).toBeDefined()
              })
            }
          }
        })
      }
    })
  })
})
