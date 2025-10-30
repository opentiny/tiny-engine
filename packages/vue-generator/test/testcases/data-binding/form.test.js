import { expect, test, describe } from 'vitest'
import path from 'path'
import fs from 'fs'
import { generateApp } from '@/generator/generateApp'
import { complexFormDataBindingSchema } from './mockData'

describe('Complex Form Data Binding Tests', () => {
  test('should handle nested form sections with data binding', async () => {
    const instance = generateApp()
    const res = await instance.generate(complexFormDataBindingSchema)
    const { genResult, errors } = res

    expect(errors).toHaveLength(0)

    const vueFile = genResult.find((file) => file.fileName === 'ComplexFormPage.vue')
    expect(vueFile).toBeDefined()

    const content = vueFile.fileContent

    // 验证嵌套表单数据绑定
    expect(content).toContain('v-model="state.user.profile.name"')
    expect(content).toContain('v-model="state.user.profile.email"')
    expect(content).toContain('v-model="state.user.preferences.language"')
    expect(content).toContain('v-model="state.user.preferences.emailNotifications"')
  })

  test('should generate correct nested state structure', async () => {
    const instance = generateApp()
    const res = await instance.generate(complexFormDataBindingSchema)
    const { genResult } = res

    const vueFile = genResult.find((file) => file.fileName === 'ComplexFormPage.vue')
    const content = vueFile.fileContent

    // 验证复杂嵌套状态结构
    expect(content).toContain('user: {')
    expect(content).toContain('profile: {')
    expect(content).toContain("name: ''")
    expect(content).toContain("email: ''")
    expect(content).toContain('preferences: {')
    expect(content).toContain("language: ''")
    expect(content).toContain('emailNotifications: false')
  })

  test('should handle multiple component types in complex form', async () => {
    const instance = generateApp()
    const res = await instance.generate(complexFormDataBindingSchema)
    const { genResult } = res

    const vueFile = genResult.find((file) => file.fileName === 'ComplexFormPage.vue')
    const content = vueFile.fileContent

    // 验证不同组件类型
    expect(content).toContain('<tiny-input') // 输入框
    expect(content).toContain('<tiny-select') // 选择框
    expect(content).toContain('<tiny-checkbox') // 复选框

    // 验证特殊属性
    expect(content).toContain('type="email"') // email类型输入框
    expect(content).toContain('label="接收邮件通知"') // checkbox标签
  })

  test('should maintain component hierarchy and styling', async () => {
    const instance = generateApp()
    const res = await instance.generate(complexFormDataBindingSchema)
    const { genResult } = res

    const vueFile = genResult.find((file) => file.fileName === 'ComplexFormPage.vue')
    const content = vueFile.fileContent

    // 验证HTML结构和样式类
    expect(content).toContain('<div class="complex-form">')
    expect(content).toContain('class="user-section"')
    expect(content).toContain('class="preferences-section"')

    // 验证嵌套div结构
    expect(content).toMatch(/<div[^>]*class="user-section"[^>]*>[\s\S]*<tiny-input[\s\S]*<\/div>/)
  })

  test('should count correct number of v-model bindings', async () => {
    const instance = generateApp()
    const res = await instance.generate(complexFormDataBindingSchema)
    const { genResult } = res

    const vueFile = genResult.find((file) => file.fileName === 'ComplexFormPage.vue')
    const content = vueFile.fileContent

    // 统计v-model数量
    const vModelMatches = content.match(/v-model[^=]*="[^"]+"/g) || []
    expect(vModelMatches).toHaveLength(4) // 4个表单字段

    // 验证每个绑定都是唯一的
    const uniqueBindings = new Set(vModelMatches)
    expect(uniqueBindings.size).toBe(4)
  })

  test('should handle different input types correctly', async () => {
    const instance = generateApp()
    const res = await instance.generate(complexFormDataBindingSchema)
    const { genResult } = res

    const vueFile = genResult.find((file) => file.fileName === 'ComplexFormPage.vue')
    const content = vueFile.fileContent

    // 验证不同输入类型的处理
    expect(content).toContain('placeholder="姓名"')
    expect(content).toContain('placeholder="邮箱"')
    expect(content).toContain('placeholder="语言偏好"')

    // 验证email类型特殊处理
    expect(content).toContain('type="email"')

    // 写入测试结果
    const outputDir = path.resolve(__dirname, './result/complex-form')
    fs.mkdirSync(outputDir, { recursive: true })

    for (const { fileName, fileContent } of genResult) {
      if (fileName.endsWith('.vue')) {
        fs.writeFileSync(path.join(outputDir, fileName), fileContent)
      }
    }
  })

  test('should generate proper component imports', async () => {
    const instance = generateApp()
    const res = await instance.generate(complexFormDataBindingSchema)
    const { genResult } = res

    const vueFile = genResult.find((file) => file.fileName === 'ComplexFormPage.vue')
    const content = vueFile.fileContent

    // 验证组件导入
    expect(content).toContain(
      "import { Input as TinyInput, Select as TinySelect, Checkbox as TinyCheckbox } from '@opentiny/vue'"
    )

    // 验证Vue导入
    expect(content).toContain("import * as vue from 'vue'")
  })
})
