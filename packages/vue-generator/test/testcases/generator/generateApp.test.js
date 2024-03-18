import { expect, test, describe } from 'vitest'
import path from 'path'
import fs from 'fs'
import { generateApp } from '@/generator/generateApp'
import { appSchemaDemo01 } from './mockData'
// import { describe } from 'node:test'

describe('generate whole application', () => {
  test('should not throw error', async () => {
    const instance = generateApp()

    const res = await instance.generate(appSchemaDemo01)
    const { genResult } = res

    genResult.forEach(({ fileName, path: filePath, fileContent }) => {
      fs.mkdirSync(path.resolve(__dirname, `./result/${filePath}`), { recursive: true })
      fs.writeFileSync(path.resolve(__dirname, `./result/${filePath}/${fileName}`), fileContent)
    })

    expect(true).toBe(true)
  })
})
