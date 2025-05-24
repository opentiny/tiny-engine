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
import { isCallEntryFile, isCompileFile, getModuleId, getTemplateId, getRelFilePath } from '../src/utils.js'

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 创建测试用例文件的辅助函数
const createTestFile = (filename, content) => {
  const filePath = path.join(__dirname, 'temp/utils-test-cases', filename)
  fs.writeFileSync(filePath, content, 'utf8')
  return filePath
}

// 确保测试目录存在
beforeAll(() => {
  const testDir = path.join(__dirname, 'temp/utils-test-cases')
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true })
  }
})

describe('utils.js', () => {
  describe('isCallEntryFile', () => {
    it('应该识别包含metaService注释的文件', () => {
      const metaServiceContent = `/* metaService */
export const myFunc = () => {}
`
      createTestFile('metaService.js', metaServiceContent)
      expect(isCallEntryFile(metaServiceContent)).toBe(true)
    })

    it('应该识别包含metaComponent注释的文件', () => {
      const metaComponentContent = `/* metaComponent */
export default {
  name: 'MyComponent'
}
`
      createTestFile('metaComponent.js', metaComponentContent)
      expect(isCallEntryFile(metaComponentContent)).toBe(true)
    })

    it('不应该识别没有元注释的文件', () => {
      const normalContent = `export const myFunc = () => {}`
      createTestFile('normal.js', normalContent)
      expect(isCallEntryFile(normalContent)).toBe(false)
    })
  })

  describe('isCompileFile', () => {
    it('应该识别包含metaComponent注释的文件', () => {
      const metaComponentContent = `/* metaComponent */
export default {
  name: 'MyComponent'
}
`
      expect(isCompileFile(metaComponentContent)).toBe(true)
    })

    it('不应识别只有metaService注释的文件', () => {
      const metaServiceContent = `/* metaService */
export const myFunc = () => {}
`
      expect(isCompileFile(metaServiceContent)).toBe(false)
    })
  })

  describe('getModuleId', () => {
    it('应该正确提取模块ID', () => {
      const content = `/* metaService: myModule */
export const myFunc = () => {}
`
      expect(getModuleId(content)).toBe('myModule')
    })

    it('没有指定模块ID时应该返回空字符串', () => {
      const contentNoId = `/* metaService */
export const myFunc = () => {}
`
      expect(getModuleId(contentNoId)).toBe('')
    })
  })

  describe('getTemplateId', () => {
    it('应该正确提取模板ID', () => {
      const comment = ` metaComponent: myTemplate `
      expect(getTemplateId(comment)).toBe('myTemplate')
    })

    it('没有指定模板ID时应该返回空字符串', () => {
      const commentNoId = ` metaComponent: `
      expect(getTemplateId(commentNoId)).toBe('')
    })
  })

  describe('getRelFilePath', () => {
    it('应该返回正确的相对路径', () => {
      const path1 = '/test/dir1/file1.js'
      const path2 = '/test/dir2/file2.js'
      expect(getRelFilePath(path1, path2)).toBe('../dir2/file2.js')
    })

    it('同一目录下应该返回以./开头的相对路径', () => {
      const path3 = '/test/dir/file1.js'
      const path4 = '/test/dir/file2.js'
      expect(getRelFilePath(path3, path4)).toBe('./file2.js')
    })
  })
})
