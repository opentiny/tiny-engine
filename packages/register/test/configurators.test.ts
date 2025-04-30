import { describe, it, expect, beforeEach } from 'vitest'
import { getConfigurator, addConfigurator } from '../src/configurators'

describe('configurators', () => {
  beforeEach(() => {
    // 清除所有之前的configurator
    // 注意：由于configurator可能在模块内部存储，所以我们通过重新定义来清理状态
    addConfigurator([])
  })

  describe('addConfigurator', () => {
    it('应该能添加配置器', () => {
      const configurator = {
        create: () => ({ id: 'test' }),
        parse: (data: any) => data
      }

      addConfigurator([{ name: 'test', component: configurator }])

      const result = getConfigurator('test')
      expect(result).toBe(configurator)
    })

    it('应该能替换已存在的配置器', () => {
      const configurator1 = {
        create: () => ({ id: 'test1' }),
        parse: (data: any) => data
      }

      const configurator2 = {
        create: () => ({ id: 'test2' }),
        parse: (data: any) => ({ ...data, modified: true })
      }

      addConfigurator([{ name: 'test', component: configurator1 }])
      expect(getConfigurator('test')).toBe(configurator1)

      addConfigurator([{ name: 'test', component: configurator2 }])
      expect(getConfigurator('test')).toBe(configurator2)
    })
  })

  describe('getConfigurator', () => {
    it('应该返回已添加的配置器', () => {
      const configurator = {
        create: () => ({ id: 'test' }),
        parse: (data: any) => data
      }

      addConfigurator([{ name: 'test', component: configurator }])

      const result = getConfigurator('test')
      expect(result).toBe(configurator)
    })

    it('当配置器不存在时应该返回undefined', () => {
      const result = getConfigurator('non-existing')
      expect(result).toBeUndefined()
    })

    it('配置器功能应该正常工作', () => {
      const configurator = {
        create: () => ({ id: 'test', type: 'component' }),
        parse: (data: any) => ({ ...data, parsed: true })
      }

      addConfigurator([{ name: 'component', component: configurator }])

      const componentConfigurator = getConfigurator('component')
      expect(componentConfigurator).toBeDefined()

      if (componentConfigurator) {
        // 测试create功能
        const created = componentConfigurator.create()
        expect(created).toEqual({ id: 'test', type: 'component' })

        // 测试parse功能
        const parsed = componentConfigurator.parse({ id: 'test' })
        expect(parsed).toEqual({ id: 'test', parsed: true })
      }
    })
  })
})
