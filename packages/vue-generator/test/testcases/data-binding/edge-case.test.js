import { expect, test, describe } from 'vitest'
import path from 'path'
import fs from 'fs'
import { generateApp } from '@/generator/generateApp'
import { edgeCaseDataBindingSchema } from './mockData'

describe('Edge Case Data Binding Tests', () => {
  test('should handle empty field gracefully', async () => {
    const instance = generateApp()
    const res = await instance.generate(edgeCaseDataBindingSchema)
    const { genResult, errors } = res

    // 不应该因为空字段而报错
    expect(errors).toHaveLength(0)

    const vueFile = genResult.find((file) => file.fileName === 'EdgeCaseDataBindingPage.vue')
    expect(vueFile).toBeDefined()

    const content = vueFile.fileContent

    // 空字段应该不生成v-model或生成空的v-model
    // 确保不会导致语法错误
    expect(content).not.toContain('v-model=""')
    expect(content).not.toContain('v-model="undefined"')
  })

  test('should remove this. prefix correctly', async () => {
    const instance = generateApp()
    const res = await instance.generate(edgeCaseDataBindingSchema)
    const { genResult } = res

    const vueFile = genResult.find((file) => file.fileName === 'EdgeCaseDataBindingPage.vue')
    const content = vueFile.fileContent

    // 应该移除this.前缀
    expect(content).toContain('v-model="state.withThis"')
    expect(content).not.toContain('v-model="this.state.withThis"')
  })

  test('should handle deep nested field paths', async () => {
    const instance = generateApp()
    const res = await instance.generate(edgeCaseDataBindingSchema)
    const { genResult } = res

    const vueFile = genResult.find((file) => file.fileName === 'EdgeCaseDataBindingPage.vue')
    const content = vueFile.fileContent

    // 深层嵌套路径应该正确处理
    expect(content).toContain('v-model="state.level1.level2.level3.deepField"')

    // 验证状态结构正确生成
    expect(content).toContain('level1: {')
    expect(content).toContain('level2: {')
    expect(content).toContain('level3: {')
    expect(content).toContain("deepField: ''")
  })

  test('should maintain correct state structure for nested objects', async () => {
    const instance = generateApp()
    const res = await instance.generate(edgeCaseDataBindingSchema)
    const { genResult } = res

    const vueFile = genResult.find((file) => file.fileName === 'EdgeCaseDataBindingPage.vue')
    const content = vueFile.fileContent

    // 验证响应式状态结构
    expect(content).toContain('vue.reactive(')
    expect(content).toContain("noComponentType: ''")
    expect(content).toContain("withThis: ''")

    // 写入测试结果
    const outputDir = path.resolve(__dirname, './result/edge-case')
    fs.mkdirSync(outputDir, { recursive: true })

    for (const { fileName, fileContent } of genResult) {
      if (fileName.endsWith('.vue')) {
        fs.writeFileSync(path.join(outputDir, fileName), fileContent)
      }
    }
  })

  test('should handle null and undefined values in JSDataBinding', async () => {
    // 创建包含null/undefined值的特殊schema
    const nullValueSchema = {
      ...edgeCaseDataBindingSchema,
      pageSchema: [
        {
          ...edgeCaseDataBindingSchema.pageSchema[0],
          children: [
            {
              componentName: 'TinyInput',
              props: {
                modelValue: {
                  type: 'JSDataBinding',
                  value: null // null值
                }
              }
            },
            {
              componentName: 'TinyInput',
              props: {
                modelValue: {
                  type: 'JSDataBinding',
                  value: undefined // undefined值
                }
              }
            }
          ]
        }
      ]
    }

    const instance = generateApp()
    const res = await instance.generate(nullValueSchema)

    // 不应该因为null/undefined而抛出异常
    expect(res.errors).toHaveLength(0)

    const vueFile = res.genResult.find((file) => file.fileName === 'EdgeCaseDataBindingPage.vue')
    expect(vueFile).toBeDefined()
  })
})
