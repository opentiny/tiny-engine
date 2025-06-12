import { describe, it, expect, vi, beforeEach } from 'vitest'
import { defineService, initServices } from '../src/service'
import { metaHashMap } from '../src/common'

// 模拟metaHashMap
vi.mock('../src/common', () => {
  return {
    metaHashMap: new Map()
  }
})

describe('service', () => {
  beforeEach(() => {
    // 清空模拟数据
    metaHashMap.clear()
  })

  describe('defineService', () => {
    it('应该正确创建服务', () => {
      const initialState = { count: 0 }
      const options = { name: 'testService' }

      const service = defineService({
        id: 'test.service',
        type: 'MetaService',
        initialState,
        options,
        init: ({ state }) => {
          state.count = 10
        },
        apis: {
          increment: (amount = 1) => {
            service.apis.setState({ count: service.apis.getState().count + amount })
          }
        }
      })

      // 验证服务基本属性
      expect(service.id).toBe('test.service')
      expect(service.type).toBe('MetaService')
      expect(service.options).toEqual(options)

      // 验证APIs
      expect(typeof service.apis.getState).toBe('function')
      expect(typeof service.apis.setState).toBe('function')
      expect(typeof service.apis.increment).toBe('function')
      expect(typeof service.apis.setOptions).toBe('function')

      // 测试状态操作
      expect(service.apis.getState().count).toBe(0)
      service.apis.setState({ count: 5 })
      expect(service.apis.getState().count).toBe(5)
      service.apis.increment(3)
      expect(service.apis.getState().count).toBe(8)

      // 测试options操作
      service.apis.setOptions({ version: '1.0.0' })
      expect(service.options).toEqual({ name: 'testService', version: '1.0.0' })
    })

    it('应该支持函数形式的APIs', () => {
      const service = defineService({
        id: 'test.service.func',
        type: 'MetaService',
        initialState: { count: 0 },
        options: {},
        init: () => {},
        apis: ({ state }) => ({
          increment: (amount = 1) => {
            state.count += amount
          },
          getCount: () => state.count
        })
      })

      // 验证函数形式的APIs
      expect(typeof service.apis.increment).toBe('function')
      expect(typeof service.apis.getCount).toBe('function')

      // 测试状态操作
      service.apis.increment(3)
      expect(service.apis.getCount()).toBe(3)
      expect(service.apis.getState().count).toBe(3)
    })

    it('应该在缺少必要参数时抛出错误', () => {
      // 缺少id
      expect(() =>
        defineService({
          type: 'MetaService',
          initialState: {},
          options: {},
          init: () => {},
          apis: {}
        } as any)
      ).toThrow('Service id and type are required')

      // 错误的类型
      expect(() =>
        defineService({
          id: 'test.service',
          type: 'WrongType' as any,
          initialState: {},
          options: {},
          init: () => {},
          apis: {}
        })
      ).toThrow('Invalid service type. Expected: MetaService')
    })
  })

  describe('initServices', () => {
    it('应该初始化所有MetaService类型的服务', () => {
      // 创建一个服务并将其添加到metaHashMap
      const service = defineService({
        id: 'test.init.service',
        type: 'MetaService',
        initialState: { initialized: false },
        options: { name: 'initService' },
        init: ({ state }) => {
          state.initialized = true
        },
        apis: {}
      })

      // 将服务添加到metaHashMap
      metaHashMap.set(service.id, {
        id: service.id,
        type: service.type,
        options: service.options
      })

      // 添加一个非MetaService类型的项
      metaHashMap.set('non.service', {
        id: 'non.service',
        type: 'NotService',
        options: {}
      })

      // 运行初始化
      initServices()

      // 验证服务是否被初始化
      expect(service.apis.getState().initialized).toBe(true)
    })
  })
})
