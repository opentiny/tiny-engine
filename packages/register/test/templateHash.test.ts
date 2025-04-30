import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useCompile } from '../src/templateHash'
import { templateHashMap } from '../src/entryHash'
// 使用类型断言解决模块导入问题
// @ts-ignore
import { compile } from 'vue/dist/vue.esm-bundler.js'

// 模拟vue的compile函数
vi.mock('vue/dist/vue.esm-bundler.js', () => ({
  compile: vi.fn().mockImplementation((template) => {
    return function mockRender() {
      return { template }
    }
  })
}))

describe('templateHash', () => {
  beforeEach(() => {
    // 清空模板哈希表
    Object.keys(templateHashMap).forEach((key) => delete templateHashMap[key])

    // 重置模拟函数
    vi.clearAllMocks()
  })

  describe('useCompile', () => {
    it('应该使用模板哈希表中的模板覆盖组件渲染函数', () => {
      // 准备测试数据
      const metaId = 'test.component'
      const customTemplate = '<template><div>Custom Template</div></template>'

      // 设置模板
      templateHashMap[metaId] = customTemplate

      // 创建模拟组件和元数据
      const mockComponent = {
        render: null
      }
      const mockMetaData = {
        id: metaId
      }

      // 调用useCompile
      const result = useCompile({
        component: mockComponent,
        metaData: mockMetaData
      })

      // 验证compile被调用，去掉template标签
      expect(compile).toHaveBeenCalledWith('<div>Custom Template</div>')

      // 验证组件的render函数被替换
      expect(result.render).toBeDefined()

      // 验证返回原始组件
      expect(result).toBe(mockComponent)
    })

    it('当没有自定义模板时不应修改组件', () => {
      // 创建模拟组件和元数据
      const originalRender = () => {}
      const mockComponent = {
        render: originalRender
      }
      const mockMetaData = {
        id: 'non.existing.component'
      }

      // 调用useCompile
      const result = useCompile({
        component: mockComponent,
        metaData: mockMetaData
      })

      // 验证compile没有被调用
      expect(compile).not.toHaveBeenCalled()

      // 验证组件的render函数没有被修改
      expect(result.render).toBe(originalRender)

      // 验证返回原始组件
      expect(result).toBe(mockComponent)
    })

    it('应该正确处理没有template标签的模板', () => {
      // 准备测试数据
      const metaId = 'test.component.raw'
      const rawTemplate = '<div>Raw Template</div>'

      // 设置模板
      templateHashMap[metaId] = rawTemplate

      // 创建模拟组件和元数据
      const mockComponent = {
        render: null
      }
      const mockMetaData = {
        id: metaId
      }

      // 调用useCompile
      useCompile({
        component: mockComponent,
        metaData: mockMetaData
      })

      // 验证compile被调用，原样使用模板
      expect(compile).toHaveBeenCalledWith('<div>Raw Template</div>')
    })

    it('应该正确处理模板周围的空白字符', () => {
      // 准备测试数据
      const metaId = 'test.component.whitespace'
      const templateWithWhitespace = '  \n  <template>  <div>Template With Whitespace</div>  </template>  \n  '

      // 设置模板
      templateHashMap[metaId] = templateWithWhitespace

      // 创建模拟组件和元数据
      const mockComponent = {
        render: null
      }
      const mockMetaData = {
        id: metaId
      }

      // 调用useCompile
      useCompile({
        component: mockComponent,
        metaData: mockMetaData
      })

      // 验证compile被调用，去掉template标签和空白
      expect(compile).toHaveBeenCalledWith('  <div>Template With Whitespace</div>  ')
    })
  })
})
