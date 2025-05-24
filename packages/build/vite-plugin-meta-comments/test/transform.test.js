/**
 * Copyright (c) 2023 - present TinyEngine Authors.
 * Copyright (c) 2023 - present Huawei Cloud Computing Technologies Co., Ltd.
 *
 * Use of this source code is governed by an MIT-style license.
 *
 * THE OPEN SOURCE SOFTWARE IN THIS PRODUCT IS DISTRIBUTED IN THE HOPE THAT IT WILL BE USEFUL,
 * BUT WITHOUT ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS FOR
 * A PARTICULAR PURPOSE. SEE THE APPLICABLE LICENSES FOR MORE DETAILS.
 *
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect, beforeAll } from 'vitest'
import { transform } from '../src/transform'
import entrySample from './legacy/code/entry?raw'

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 确保测试目录存在
beforeAll(() => {
  const testDir = path.join(__dirname, 'temp/transform-test-cases')
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true })
  }

  // 创建meta.js文件用于测试
  const metaJsContent = `
export default {
  id: 'test-meta',
  name: '测试元数据'
}
`
  const metaJsPath = path.join(__dirname, 'temp/transform-test-cases/meta.js')
  fs.writeFileSync(metaJsPath, metaJsContent, 'utf8')
})

// 创建测试用例文件的辅助函数
const createTestFile = (filename, content) => {
  const filePath = path.join(__dirname, 'temp/transform-test-cases', filename)
  fs.writeFileSync(filePath, content, 'utf8')
  return filePath
}

// 执行转换并验证结果
const testTransformAndVerify = async (fileName, expectedPatterns) => {
  const filePath = path.join(__dirname, 'temp/transform-test-cases', fileName)
  const code = fs.readFileSync(filePath, 'utf8')
  const result = transform(code, filePath)

  // 确保转换结果不为空
  expect(result).toBeTruthy()
  expect(result.length).toBeGreaterThan(0)

  // 验证是否包含预期的导入模式
  for (const pattern of expectedPatterns) {
    expect(result).toMatch(pattern)
  }

  // 将转换结果写入输出文件，用于手动检查
  await expect(result).toMatchFileSnapshot(`./expected/${fileName}.output.js`)

  return result
}

describe('transform.js', () => {
  describe('转换包含metaService注释的文件', () => {
    it('应该正确转换并添加导入语句', async () => {
      // 创建测试文件
      const content = `/* metaService: testModule */
import { reactive } from 'vue'

export const useTestService = () => {
  const state = reactive({
    count: 0
  })
  
  const increment = () => {
    state.count++
  }
  
  return {
    state,
    increment
  }
}
`
      createTestFile('meta-service.js', content)

      // 执行转换
      const result = await testTransformAndVerify('meta-service.js', [
        /import .* from ['"]\.\/meta\.js['"]/, // 匹配元数据导入
        /import.*callEntry.*from ['"]@opentiny\/tiny-engine-meta-register['"]/, // 匹配callEntry导入
        /import.*useCompile.*from ['"]@opentiny\/tiny-engine-meta-register['"]/ // 匹配useCompile导入
      ])

      // 检查是否包含callEntry调用
      expect(result).toMatch(/callEntry\(/)
    })
  })

  describe('转换包含函数表达式的文件', () => {
    it('应该正确转换函数表达式', async () => {
      // 创建测试文件
      const content = `/* metaService */
const doSomething = function() {
  console.log('Doing something')
  return true
}

export { doSomething }
`
      createTestFile('function-expr.js', content)

      // 执行转换
      const result = await testTransformAndVerify('function-expr.js', [
        /import .* from ['"]\.\/meta\.js['"]/, // 匹配元数据导入
        /import.*callEntry.*from ['"]@opentiny\/tiny-engine-meta-register['"]/, // 匹配callEntry导入
        /import.*useCompile.*from ['"]@opentiny\/tiny-engine-meta-register['"]/ // 匹配useCompile导入
      ])

      // 检查是否包含callEntry调用和函数表达式
      expect(result).toMatch(/callEntry\(/)
      expect(result).toMatch(/function \(\) {/)
    })
  })

  describe('转换包含箭头函数的文件', () => {
    it('应该正确转换箭头函数', async () => {
      // 创建测试文件
      const content = `/* metaService */
const arrowFunc = () => {
  console.log('Arrow function')
  return true
}

export { arrowFunc }
`
      createTestFile('arrow-func.js', content)

      // 执行转换
      const result = await testTransformAndVerify('arrow-func.js', [
        /import .* from ['"]\.\/meta\.js['"]/, // 匹配元数据导入
        /import.*callEntry.*from ['"]@opentiny\/tiny-engine-meta-register['"]/, // 匹配callEntry导入
        /import.*useCompile.*from ['"]@opentiny\/tiny-engine-meta-register['"]/ // 匹配useCompile导入
      ])

      // 检查是否包含callEntry调用和箭头函数
      expect(result).toMatch(/callEntry\(/)
      expect(result).toMatch(/\(\) =>/)
    })
  })

  describe('转换包含Vue钩子的文件', () => {
    it('应该正确转换Vue生命周期钩子', async () => {
      // 创建测试文件
      const content = `/* metaService */
import { onMounted, onBeforeMount } from 'vue'

export const useHooks = () => {
  onMounted(() => {
    console.log('Component mounted')
  })
  
  onBeforeMount(() => {
    console.log('Component will mount')
  })
}
`
      createTestFile('vue-hooks.js', content)

      // 执行转换
      const result = await testTransformAndVerify('vue-hooks.js', [
        /import .* from ['"]\.\/meta\.js['"]/, // 匹配元数据导入
        /import.*callEntry.*from ['"]@opentiny\/tiny-engine-meta-register['"]/, // 匹配callEntry导入
        /import.*useCompile.*from ['"]@opentiny\/tiny-engine-meta-register['"]/ // 匹配useCompile导入
      ])

      // 检查是否包含对Vue钩子的处理
      expect(result).toMatch(/onMounted\(/)
      expect(result).toMatch(/callEntry\(/)
    })
  })

  describe('转换不包含元注释的文件', () => {
    it('对于没有元注释的文件，transform应返回undefined', () => {
      // 创建无元注释的文件
      const content = `
export const regularFunction = () => {
  console.log('Regular function')
}
`
      createTestFile('no-meta.js', content)

      const filePath = path.join(__dirname, 'temp/transform-test-cases/no-meta.js')
      const code = fs.readFileSync(filePath, 'utf8')

      // 执行转换
      const result = transform(code, filePath)

      // 对于没有元注释的文件，transform应返回undefined
      expect(result).toBeUndefined()
    })
  })

  describe('转换entry.js文件', () => {
    it('转换 entry.js 综合测试', async () => {
      createTestFile('entry.js', entrySample)
      await testTransformAndVerify('entry.js', [])
    })
  })
})
