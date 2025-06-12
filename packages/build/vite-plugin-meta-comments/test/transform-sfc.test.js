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
import { transformSFC } from '../src/transform-sfc.js'

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 确保测试目录存在并创建meta.js
beforeAll(() => {
  const testDir = path.join(__dirname, 'temp/transform-sfc-test-cases')
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
  const metaJsPath = path.join(__dirname, 'temp/transform-sfc-test-cases/meta.js')
  fs.writeFileSync(metaJsPath, metaJsContent, 'utf8')
})

// 创建测试用例文件的辅助函数
const createTestFile = (filename, content) => {
  const filePath = path.join(__dirname, 'temp/transform-sfc-test-cases', filename)
  fs.writeFileSync(filePath, content, 'utf8')
  return filePath
}

// 执行转换并验证结果
const testTransformAndVerify = async (fileName, expectTransformed = true) => {
  const filePath = path.join(__dirname, 'temp/transform-sfc-test-cases', fileName)
  const code = fs.readFileSync(filePath, 'utf8')

  const result = transformSFC(code, filePath)

  if (expectTransformed) {
    // 确保转换结果不为空
    expect(result).toBeTruthy()
    expect(result.length).toBeGreaterThan(0)
    await expect(result).toMatchFileSnapshot(`./expected/${fileName}.output.vue`)
  } else {
    // 对于不应被转换的文件，transformSFC应返回undefined
    expect(result).toBeUndefined()
  }

  return result
}

describe('transform-sfc.js', () => {
  describe('转换包含metaService注释的Vue SFC', () => {
    it('应该正确转换单文件组件并添加callEntry调用', async () => {
      // 创建包含metaService注释的Vue SFC文件
      const content = `<template>
  <div>
    <h1>{{ title }}</h1>
    <button @click="increment">Count: {{ state.count }}</button>
  </div>
</template>

<script>
/* metaService */
import { reactive, ref } from 'vue'

export default {
  name: 'TestComponent',
  setup() {
    const title = ref('Test Component')
    const state = reactive({
      count: 0
    })
    
    const increment = () => {
      state.count++
    }
    
    return {
      title,
      state,
      increment
    }
  }
}
</script>

<style>
h1 {
  color: blue;
}
</style>`

      createTestFile('meta-service.vue', content)

      // 执行转换
      const result = await testTransformAndVerify('meta-service.vue')

      // 检查转换结果是否包含callEntry调用
      expect(result).toMatch(/callEntry\(/)

      // 检查转换结果是否保留了原始的template和style标签
      expect(result).toMatch(/<template>/)
      expect(result).toMatch(/<style>/)
    })
  })

  describe('转换包含script setup的Vue SFC', () => {
    it('应该正确转换使用setup语法糖的组件', async () => {
      // 创建包含script setup的Vue SFC文件
      const content = `<template>
  <div>
    <h1>{{ title }}</h1>
    <button @click="increment">Count: {{ count }}</button>
  </div>
</template>

<script setup>
/* metaService */
import { ref } from 'vue'

const title = ref('Script Setup Component')
const count = ref(0)

const increment = () => {
  count.value++
}
</script>

<style>
h1 {
  color: green;
}
</style>`

      createTestFile('script-setup.vue', content)

      // 执行转换
      const result = await testTransformAndVerify('script-setup.vue')

      // 检查转换结果是否包含callEntry调用
      expect(result).toMatch(/callEntry\(/)

      // 检查转换结果是否保留了script setup语法
      expect(result).toMatch(/<script setup>/)
    })
  })

  describe('转换不包含元注释的Vue SFC', () => {
    it('不应转换没有元注释的组件', async () => {
      // 创建不包含元注释的Vue SFC文件
      const content = `<template>
  <div>
    <h1>{{ title }}</h1>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'RegularComponent',
  setup() {
    const title = ref('Regular Component')
    
    return {
      title
    }
  }
}
</script>`

      createTestFile('no-meta.vue', content)

      // 执行转换，预期不会被转换
      await testTransformAndVerify('no-meta.vue', false)
    })
  })
})
