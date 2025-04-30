import { describe, it, expect, beforeEach } from 'vitest'
import {
  preprocessRegistry,
  getMergeMeta,
  getMergeMetaByType,
  getAllMergeMeta,
  getMetaApi,
  getOptions,
  mergeRegistry,
  metaHashMap,
  apisMap,
  optionsMap
} from '../src/common'

describe('common', () => {
  beforeEach(() => {
    // 清空所有Map和对象
    metaHashMap.clear()
    Object.keys(apisMap).forEach((key) => delete apisMap[key])
    Object.keys(optionsMap).forEach((key) => delete optionsMap[key])
  })

  describe('preprocessRegistry', () => {
    it('应该正确处理数组格式的元应用配置', () => {
      const registry = {
        plugins: [
          // 普通格式
          { id: 'plugin1', title: 'Plugin 1' },
          // 数组格式 [meta, extraConfig]
          [{ id: 'plugin2', title: 'Plugin 2' }, { options: { customOptions: true } }]
        ]
      }

      preprocessRegistry(registry)

      // 验证数组格式被正确处理
      expect(registry.plugins[1]).toEqual({
        id: 'plugin2',
        title: 'Plugin 2',
        options: { customOptions: true }
      })
    })
  })

  describe('mergeRegistry', () => {
    it('应该正确合并注册表', () => {
      const defaultRegistry = {
        layout: {
          id: 'engine.layout',
          options: {
            width: '200px',
            height: '400px'
          }
        },
        plugins: [
          {
            id: 'engine.plugin1',
            title: 'Plugin 1',
            type: 'plugin'
          }
        ]
      }

      const customRegistry = {
        'engine.layout': {
          options: {
            width: '300px'
          }
        },
        'engine.plugin1': {
          title: 'Custom Plugin 1'
        }
      }

      // 合并注册表
      mergeRegistry(defaultRegistry, customRegistry)

      // 验证metaHashMap是否正确更新
      const layout = getMergeMeta('engine.layout')
      const plugin1 = getMergeMeta('engine.plugin1')

      expect(layout).toBeDefined()
      expect(layout?.options?.width).toBe('300px')
      expect(layout?.options?.height).toBe('400px')

      expect(plugin1).toBeDefined()
      expect(plugin1?.title).toBe('Custom Plugin 1')
      expect(plugin1?.type).toBe('plugin')
    })

    it('应该能删除默认插件', () => {
      const defaultRegistry = {
        plugins: [
          {
            id: 'engine.plugin1',
            title: 'Plugin 1'
          }
        ]
      }

      const customRegistry = {
        'engine.plugin1': null // 删除插件
      }

      // 初始化默认注册表
      mergeRegistry(defaultRegistry)

      // 验证插件已添加
      expect(getMergeMeta('engine.plugin1')).toBeDefined()

      // 应用自定义注册表删除插件
      mergeRegistry({}, customRegistry)

      // 验证插件已删除
      expect(getMergeMeta('engine.plugin1')).toBeUndefined()
    })

    it('应该能添加新插件', () => {
      const defaultRegistry = {
        plugins: []
      }

      const customRegistry = {
        'engine.newPlugin': {
          id: 'engine.newPlugin',
          title: 'New Plugin',
          type: 'plugin',
          apis: {
            doSomething: () => 'done'
          },
          options: {
            isEnabled: true
          }
        }
      }

      // 合并注册表
      mergeRegistry(defaultRegistry, customRegistry)

      // 验证新插件添加成功
      const newPlugin = getMergeMeta('engine.newPlugin')
      expect(newPlugin).toBeDefined()
      expect(newPlugin?.title).toBe('New Plugin')

      // 验证API和options是否正确注册
      const api = getMetaApi('engine.newPlugin')
      const options = getOptions('engine.newPlugin')

      expect(api).toBeDefined()
      expect(api.doSomething()).toBe('done')
      expect(options).toEqual({ isEnabled: true })
    })
  })

  describe('getMergeMetaByType', () => {
    it('应该根据类型返回元数据', () => {
      // 准备不同类型的元数据
      const metas = [
        { id: 'plugin1', type: 'plugin' },
        { id: 'plugin2', type: 'plugin' },
        { id: 'service1', type: 'service' }
      ]

      // 添加到metaHashMap
      metas.forEach((meta) => metaHashMap.set(meta.id, meta))

      // 获取所有plugin类型的元数据
      const plugins = getMergeMetaByType('plugin')

      expect(plugins.length).toBe(2)
      expect(plugins[0].id).toBe('plugin1')
      expect(plugins[1].id).toBe('plugin2')

      // 获取所有service类型的元数据
      const services = getMergeMetaByType('service')

      expect(services.length).toBe(1)
      expect(services[0].id).toBe('service1')
    })
  })

  describe('getAllMergeMeta', () => {
    it('应该返回所有元数据', () => {
      // 准备元数据
      const metas = [
        { id: 'plugin1', type: 'plugin' },
        { id: 'service1', type: 'service' }
      ]

      // 添加到metaHashMap
      metas.forEach((meta) => metaHashMap.set(meta.id, meta))

      // 获取所有元数据
      const allMetas = getAllMergeMeta()

      expect(allMetas.length).toBe(2)
      expect(allMetas).toEqual(
        expect.arrayContaining([
          { id: 'plugin1', type: 'plugin' },
          { id: 'service1', type: 'service' }
        ])
      )
    })
  })

  describe('getMetaApi and getOptions', () => {
    it('应该返回正确的API和选项', () => {
      // 设置API和选项
      apisMap['test.id'] = {
        getData: () => 'data',
        setData: (value) => value
      }

      optionsMap['test.id'] = {
        isEnabled: true,
        theme: 'dark'
      }

      // 获取API
      const api = getMetaApi('test.id')
      expect(api).toBeDefined()
      expect(api.getData()).toBe('data')
      expect(api.setData('newData')).toBe('newData')

      // 获取特定API
      const getDataApi = getMetaApi('test.id', 'getData')
      expect(getDataApi()).toBe('data')

      // 获取选项
      const options = getOptions('test.id')
      expect(options).toEqual({
        isEnabled: true,
        theme: 'dark'
      })
    })

    it('在API或选项不存在时应返回undefined', () => {
      expect(getMetaApi('non.existing')).toBeUndefined()
      expect(getMetaApi('non.existing', 'method')).toBeUndefined()
      expect(getOptions('non.existing')).toBeUndefined()
    })
  })
})
