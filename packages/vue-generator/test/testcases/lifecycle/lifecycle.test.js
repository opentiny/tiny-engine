import { expect, test, describe } from 'vitest'
import path from 'path'
import fs from 'fs'
import { generateApp } from '@/generator/generateApp'
import { lifecycleTestSchema, complexLifecycleSchema } from './mockData'

describe('Lifecycle Hooks', () => {
  test('should generate Vue 3 lifecycle hooks from JS_LIFECYCLE', async () => {
    const instance = generateApp()
    const res = await instance.generate(lifecycleTestSchema)
    const { genResult, errors } = res

    // 检查是否有错误
    expect(errors).toHaveLength(0)

    // 找到生成的 Vue 页面文件
    const vueFile = genResult.find((file) => file.fileName === 'LifecycleTestPage.vue')
    expect(vueFile).toBeDefined()

    const content = vueFile.fileContent

    // 验证包含生命周期钩子
    expect(content).toContain('vue.onMounted(')
    expect(content).toContain("console.log('Component mounted')")
    expect(content).toContain('vue.onUnmounted(')
    expect(content).toContain("console.log('Component unmounted')")
    expect(content).toContain('vue.onUpdated(')
    expect(content).toContain("console.log('Component updated')")
    expect(content).toContain('vue.onBeforeMount(')
    expect(content).toContain("console.log('Before mount')")

    // 写入测试结果文件（可选，用于调试）
    const outputDir = path.resolve(__dirname, './result/basic')
    fs.mkdirSync(outputDir, { recursive: true })

    for (const { fileName, fileContent } of genResult) {
      if (fileName.endsWith('.vue')) {
        fs.writeFileSync(path.join(outputDir, fileName), fileContent)
      }
    }
  })

  test('should handle complex lifecycle scenarios', async () => {
    const instance = generateApp()
    const res = await instance.generate(complexLifecycleSchema)
    const { genResult, errors } = res

    expect(errors).toHaveLength(0)

    const vueFile = genResult.find((file) => file.fileName === 'ComplexLifecyclePage.vue')
    expect(vueFile).toBeDefined()

    const content = vueFile.fileContent

    // 验证复杂的生命周期逻辑
    expect(content).toContain('vue.onMounted(')
    expect(content).toContain('initializeData()')
    expect(content).toContain('setupEventListeners()')
    expect(content).toContain('vue.onBeforeUnmount(')
    expect(content).toContain('cleanup()')
    expect(content).toContain('removeEventListeners()')
    expect(content).toContain('vue.onErrorCaptured(')
    expect(content).toContain('handleError(error)')
    expect(content).toContain('reportError(error)')

    // 验证组件正确渲染
    expect(content).toContain('<div class="complex-component">')

    // 写入测试结果文件
    const outputDir = path.resolve(__dirname, './result/complex')
    fs.mkdirSync(outputDir, { recursive: true })

    for (const { fileName, fileContent } of genResult) {
      if (fileName.endsWith('.vue')) {
        fs.writeFileSync(path.join(outputDir, fileName), fileContent)
      }
    }
  })

  test('should handle lifecycle in component props', async () => {
    const instance = generateApp()
    const res = await instance.generate(lifecycleTestSchema)
    const { genResult, errors } = res

    expect(errors).toHaveLength(0)

    const vueFile = genResult.find((file) => file.fileName === 'LifecycleTestPage.vue')
    expect(vueFile).toBeDefined()

    const content = vueFile.fileContent

    // 验证生命周期钩子不会作为属性绑定到组件上
    expect(content).not.toContain('onMounted=')
    expect(content).not.toContain(':onMounted=')

    // 而是应该在script中
    expect(content).toContain('vue.onMounted(')
    expect(content).toContain("console.log('Component mounted')")
  })
})
