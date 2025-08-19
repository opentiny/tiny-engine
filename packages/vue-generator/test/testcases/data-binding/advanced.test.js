import { expect, test, describe } from 'vitest'
import path from 'path'
import fs from 'fs'
import { generateApp } from '@/generator/generateApp'
import { advancedDataBindingSchema } from './mockData'

describe('Advanced Data Binding', () => {
  test('should generate v-model for nested object bindings', async () => {
    const instance = generateApp()
    const res = await instance.generate(advancedDataBindingSchema)
    const { genResult, errors } = res

    // 检查是否有错误
    expect(errors).toHaveLength(0)

    // 找到生成的 Vue 页面文件
    const vueFile = genResult.find((file) => file.fileName === 'AdvancedFormPage.vue')
    expect(vueFile).toBeDefined()

    const content = vueFile.fileContent

    // 验证包含 v-model 绑定
    expect(content).toContain('v-model')

    // 验证嵌套对象数据绑定
    expect(content).toContain('v-model="state.formData.address.detail"')
    expect(content).toContain('v-model="state.formData.address.zipCode"')

    // 验证基础字段绑定
    expect(content).toContain('v-model="state.formData.username"')
    expect(content).toContain('v-model="state.formData.enabled"')
    expect(content).toContain('v-model="state.formData.gender"')
    expect(content).toContain('v-model="state.formData.remarks"')
    expect(content).toContain('v-model="state.formData.category"')

    // 写入测试结果文件
    const outputDir = path.resolve(__dirname, './result/advanced')
    fs.mkdirSync(outputDir, { recursive: true })

    for (const { fileName, fileContent } of genResult) {
      if (fileName.endsWith('.vue')) {
        fs.writeFileSync(path.join(outputDir, fileName), fileContent)
      }
    }
  })

  test('should handle multiple component types with data binding', async () => {
    const instance = generateApp()
    const res = await instance.generate(advancedDataBindingSchema)
    const { genResult } = res

    const vueFile = genResult.find((file) => file.fileName === 'AdvancedFormPage.vue')
    const content = vueFile.fileContent

    // 统计 v-model 绑定数量
    const vModelMatches = content.match(/v-model[^=]*="[^"]+"/g) || []

    // 应该有8个 v-model 绑定
    expect(vModelMatches).toHaveLength(8)

    // 验证所有组件类型都正确生成
    expect(content).toContain('<tiny-input')
    expect(content).toContain('<tiny-switch')
    expect(content).toContain('<tiny-radio')
    expect(content).toContain('<textarea')
    expect(content).toContain('<select')
  })

  test('should generate reactive state for nested objects', async () => {
    const instance = generateApp()
    const res = await instance.generate(advancedDataBindingSchema)
    const { genResult } = res

    const vueFile = genResult.find((file) => file.fileName === 'AdvancedFormPage.vue')
    const content = vueFile.fileContent

    // 验证嵌套状态对象结构
    expect(content).toContain('formData: {')
    expect(content).toContain('address: {')
    expect(content).toContain("detail: ''")
    expect(content).toContain("zipCode: ''")

    // 验证状态是响应式的
    expect(content).toContain('vue.reactive(')
  })

  test('should handle radio button groups correctly', async () => {
    const instance = generateApp()
    const res = await instance.generate(advancedDataBindingSchema)
    const { genResult } = res

    const vueFile = genResult.find((file) => file.fileName === 'AdvancedFormPage.vue')
    const content = vueFile.fileContent

    // 验证单选框组绑定到同一个字段
    const genderBindings = content.match(/v-model="state\.formData\.gender"/g) || []
    expect(genderBindings).toHaveLength(2) // 两个单选框绑定到同一字段

    // 验证单选框的 value 属性
    expect(content).toContain('value="male"')
    expect(content).toContain('value="female"')
  })
})
