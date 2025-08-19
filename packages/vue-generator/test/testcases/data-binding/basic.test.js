import { expect, test, describe } from 'vitest'
import path from 'path'
import fs from 'fs'
import { generateApp } from '@/generator/generateApp'
import { basicDataBindingSchema } from './mockData'

describe('Basic Data Binding', () => {
  test('should generate v-model for basic form components', async () => {
    const instance = generateApp()
    const res = await instance.generate(basicDataBindingSchema)
    const { genResult, errors } = res

    // 检查是否有错误
    expect(errors).toHaveLength(0)

    // 找到生成的 Vue 页面文件
    const vueFile = genResult.find((file) => file.fileName === 'BasicDataBindingPage.vue')
    expect(vueFile).toBeDefined()

    const content = vueFile.fileContent

    // 验证包含 v-model 绑定
    expect(content).toContain('v-model')

    // 验证具体的数据绑定
    expect(content).toContain('v-model="state.username"')
    expect(content).toContain('v-model="state.role"')
    expect(content).toContain('v-model="state.agreed"')

    // 验证组件正确渲染
    expect(content).toContain('<tiny-input')
    expect(content).toContain('<tiny-select')
    expect(content).toContain('<input')

    // 验证状态定义
    expect(content).toContain("username: ''")
    expect(content).toContain("role: ''")
    expect(content).toContain('agreed: false')

    // 写入测试结果文件（可选，用于调试）
    const outputDir = path.resolve(__dirname, './result/basic')
    fs.mkdirSync(outputDir, { recursive: true })

    for (const { fileName, fileContent } of genResult) {
      if (fileName.endsWith('.vue')) {
        fs.writeFileSync(path.join(outputDir, fileName), fileContent)
      }
    }
  })

  test('should handle different component types correctly', async () => {
    const instance = generateApp()
    const res = await instance.generate(basicDataBindingSchema)
    const { genResult } = res

    const vueFile = genResult.find((file) => file.fileName === 'BasicDataBindingPage.vue')
    const content = vueFile.fileContent

    // 验证不同组件类型的 v-model 生成
    const vModelMatches = content.match(/v-model[^=]*="[^"]+"/g) || []

    // 应该有3个 v-model 绑定
    expect(vModelMatches).toHaveLength(3)

    // 验证每个绑定都是正确的
    expect(vModelMatches).toContain('v-model="state.username"')
    expect(vModelMatches).toContain('v-model="state.role"')
    expect(vModelMatches).toContain('v-model="state.agreed"')
  })
})
