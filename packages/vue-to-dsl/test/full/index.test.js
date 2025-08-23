import { describe, it, expect } from 'vitest'
import { VueToDslConverter } from '../../src/converter'
import { generateAppSchema } from '../../src/generator'
import fs from 'fs'
import path from 'path'

const fullDir = __dirname
const inputDir = path.join(fullDir, 'input')
const outputDir = path.join(fullDir, 'output')

function writeOutput(name, schema) {
  fs.mkdirSync(outputDir, { recursive: true })
  const file = path.join(outputDir, `${name}`)
  fs.writeFileSync(file, JSON.stringify(schema, null, 2), 'utf-8')
  return file
}

describe('Full - convertMultipleFiles on fixed inputs', () => {
  it('should convert page1.vue and page2.vue and write outputs', async () => {
    // 检查input目录下的文件列表
    const inputFiles = fs.readdirSync(inputDir).filter((f) => f.endsWith('.vue'))
    console.log('Input directory files:', inputFiles)

    // 给inputFiles的每个文件生成绝对路径
    const inputFilePathList = []
    inputFiles.forEach((f, idx) => {
      inputFilePathList.push(path.join(inputDir, f))
    })
    console.log('Input directory absolute files:', inputFilePathList)

    const converter = new VueToDslConverter()
    const results = await converter.convertMultipleFiles(inputFilePathList)

    const names = []
    inputFiles.forEach((f, idx) => {
      names.push(f.replace('.vue', ''))
    })
    results.forEach((r, idx) => {
      // 基本成功断言
      expect(r.errors).toHaveLength(0)
      expect(r.schema).toBeDefined()
      expect(r.schema.componentName).toBe('Page')

      // fileName/meta.name 应与文件名一致
      expect(r.schema.fileName).toBe(names[idx])
      expect(r.schema.meta && r.schema.meta.name).toBe(names[idx])

      // 根节点分配了 8 位 id
      expect(typeof r.schema.id).toBe('string')
      expect(r.schema.id).toMatch(/^[a-z0-9]{8}$/)

      // children 至少包含一个根元素
      expect(Array.isArray(r.schema.children)).toBe(true)
      expect(r.schema.children.length).toBeGreaterThan(0)
    })

    // results的每个schema合并到新的数组里
    const schema = generateAppSchema(results.map((r) => r.schema))
    writeOutput('schema.json', schema)
  })
})
