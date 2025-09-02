import { describe, it, expect } from 'vitest'
import { VueToDslConverter } from '../../src/converter'
import fs from 'fs'
import path from 'path'

const fullDir = __dirname
const inputDir = path.join(fullDir, 'input')
const appDir = path.join(inputDir, 'appdemo01')
const outputDir = path.join(fullDir, 'output')

function writeOutput(name, schema) {
  fs.mkdirSync(outputDir, { recursive: true })
  const file = path.join(outputDir, `${name}`)
  fs.writeFileSync(file, JSON.stringify(schema, null, 2), 'utf-8')
  return file
}

describe('Full - convert app directory', () => {
  it('should convert input/appdemo01 into a merged schema.json', async () => {
    const converter = new VueToDslConverter()
    const schema = await converter.convertAppDirectory(appDir)
    // 关键字段基本断言
    expect(schema).toBeDefined()
    expect(schema.pageSchema && Array.isArray(schema.pageSchema)).toBe(true)
    expect(schema.i18n && schema.i18n.en_US && schema.i18n.zh_CN).toBeDefined()
    expect(schema.dataSource && Array.isArray(schema.dataSource.list)).toBe(true)
    expect(Array.isArray(schema.globalState)).toBe(true)
    writeOutput('schema.json', schema)
  })

  it('should convert appdemo01.zip buffer into a merged schema.json', async () => {
    const converter = new VueToDslConverter()
    const zipPath = path.join(inputDir, 'appdemo01.zip')
    const zipBuf = fs.readFileSync(zipPath)
    const schema = await converter.convertAppFromZip(zipBuf)
    expect(schema).toBeDefined()
    expect(schema.pageSchema && Array.isArray(schema.pageSchema)).toBe(true)
    expect(schema.i18n && schema.i18n.en_US && schema.i18n.zh_CN).toBeDefined()
    expect(schema.dataSource && Array.isArray(schema.dataSource.list)).toBe(true)
    expect(Array.isArray(schema.globalState)).toBe(true)
    writeOutput('schema.from-zip.json', schema)
  })
})
