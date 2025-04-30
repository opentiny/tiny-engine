import { expect, describe, it, vi, beforeEach, afterEach } from 'vitest'
// import { mergeRegistry } from '../src/common'
import {
  defineEntry,
  entryHashMap,
  templateHashMap,
  callEntry,
  beforeCallEntry,
  afterCallEntry,
  fetchHotfixRegistry,
  initHotfixRegistry
} from '../src/entryHash'
// import { join } from 'path'
import { writeFileSync, unlinkSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
// import { getMergeMeta } from '../src/common'

// TODO: 测试用例需要更新
// run this test suite in parallel
// describe.concurrent('mergeRegistry', () => {
//   const defaultRegistry = {
//     layout: {
//       id: 'engine.layout',
//       options: {
//         pluginPanelWidth: '200px',
//         pluginIconSize: '24px'
//       }
//     },
//     plugins: [
//       {
//         id: 'engine.plugins.materials',
//         title: '物料',
//         type: 'plugins',
//         icon: 'plugin-icon-materials',
//         component: 'Material',
//         layout: {
//           id: 'engine.plugin.materials.layout',
//           component: 'MaterialsLayout',
//           apis: {},
//           options: {}
//         },
//         metas: [
//           {
//             id: 'engine.plugins.materials.component',
//             title: '组件',
//             type: 'metaApp',
//             component: 'ComponentList',
//             apis: {},
//             options: {}
//           },
//           {
//             id: 'engine.plugins.materials.block',
//             title: '区块',
//             type: 'metaApp',
//             component: 'MaterialList'
//           }
//         ]
//       },
//       {
//         id: 'engine.plugins.outlinetree',
//         title: '大纲树',
//         type: 'plugins',
//         icon: 'plugin-icon-tree',
//         align: 'top',
//         component: 'OutlineTree'
//       },
//       {
//         id: 'engine.plugins.i18n',
//         title: '国际化',
//         type: 'plugins',
//         align: 'top',
//         component: 'I18n'
//       }
//     ]
//   }
//   it('should merge registry correctly', () => {
//     const registry = {
//       'engine.layout': {
//         options: {
//           pluginPanelWidth: '100px'
//         }
//       },
//       'engine.plugins.outlinetree': {
//         component: 'MyCustomOutline'
//       }
//     }

//     const expected = {
//       layout: {
//         id: 'engine.layout',
//         options: {
//           pluginPanelWidth: '100px', // should replaced to 100px
//           pluginIconSize: '24px' // should merge from defaultRegistry
//         }
//       },
//       plugins: [
//         // should only include one plugin
//         {
//           id: 'engine.plugins.outlinetree',
//           title: '大纲树', // should merged from defaultRegistry
//           type: 'plugins', // should merged from defaultRegistry
//           icon: 'plugin-icon-tree', // should merged from defaultRegistry
//           align: 'top', // should merged from defaultRegistry
//           component: 'MyCustomOutline' // should replace component
//         }
//       ]
//     }

//     defineEntry(defaultRegistry)
//     mergeRegistry(registry)

//     const layout = getMergeMeta('engine.layout')
//     const outlineTree = getMergeMeta('engine.plugins.outlinetree')

//     expect(layout?.options?.pluginPanelWidth).toEqual('100px')
//     expect(outlineTree?.component).toEqual('MyCustomOutline')
//   })

//   it('should not change origin defaultRegistry', () => {
//     const registry = {
//       'engine.layout': {
//         options: {
//           pluginPanelWidth: '100px'
//         }
//       },
//       'engine.plugins.outlinetree': {
//         component: 'MyCustomOutline'
//       }
//     }

//     defineEntry(defaultRegistry)
//     mergeRegistry(registry)

//     const layout = getMergeMeta('engine.layout')
//     const outlineTree = getMergeMeta('engine.plugins.outlinetree')
//     const material = getMergeMeta('engine.plugins.materials')

//     expect(layout?.options?.pluginIconSize).toEqual('24px')
//     expect(outlineTree?.title).toEqual('大纲树')
//     expect(material).toBeDefined()
//   })
// })

describe('entryHash', () => {
  beforeEach(() => {
    // 清空哈希表
    Object.keys(entryHashMap).forEach((key) => delete entryHashMap[key])
    Object.keys(templateHashMap).forEach((key) => delete templateHashMap[key])

    // 重置所有mocks
    vi.resetAllMocks()

    // 模拟import函数
    vi.stubGlobal('import', vi.fn())
  })

  describe('defineEntry', () => {
    it('应该正确定义入口并处理覆盖', () => {
      const registry = {
        'engine.plugin1': {
          id: 'engine.plugin1',
          overwrite: {
            methods: {
              '': {
                // 空文件ID
                handleClick: () => 'clicked'
              },
              file1: {
                // 有文件ID
                handleSubmit: () => 'submitted'
              }
            },
            lifeCycles: {
              '': {
                onMounted: () => 'mounted'
              },
              file1: {
                onUnmounted: [() => 'unmounted1', () => 'unmounted2']
              }
            },
            templates: {
              '': '<div>Template</div>',
              subTemplate: '<span>Sub Template</span>'
            }
          }
        }
      }

      defineEntry(registry)

      // 检查方法是否正确注册
      expect(entryHashMap['engine.plugin1.handleClick']).toBeDefined()
      expect(entryHashMap['engine.plugin1.file1.handleSubmit']).toBeDefined()
      expect(typeof entryHashMap['engine.plugin1.handleClick']).toBe('function')
      expect(typeof entryHashMap['engine.plugin1.file1.handleSubmit']).toBe('function')

      // 检查生命周期是否正确注册
      expect(entryHashMap['engine.plugin1.onMounted[0]']).toBeDefined()
      expect(entryHashMap['engine.plugin1.file1.onUnmounted[0]']).toBeDefined()
      expect(entryHashMap['engine.plugin1.file1.onUnmounted[1]']).toBeDefined()
      expect(typeof entryHashMap['engine.plugin1.onMounted[0]']).toBe('function')

      // 检查模板是否正确注册
      expect(templateHashMap['engine.plugin1']).toBe('<div>Template</div>')
      expect(templateHashMap['engine.plugin1.subTemplate']).toBe('<span>Sub Template</span>')
    })

    it('应该抛出错误如果注册表是空的', () => {
      expect(() => defineEntry(null)).toThrow('请传递正确的注册表')
      expect(() => defineEntry(undefined)).toThrow('请传递正确的注册表')
    })
  })

  describe('callEntry', () => {
    it('应该调用自定义方法覆盖默认方法', () => {
      // 定义一个默认方法
      const defaultFn = () => 'default'

      // 定义一个自定义方法
      const customFn = (ctx: any, fn: () => string) => {
        return 'custom: ' + fn()
      }

      // 注册自定义方法
      entryHashMap['test.id'] = customFn

      // 创建metaData和ctx
      const metaData = { id: 'test.id' }
      const ctx = {}

      // 调用callEntry
      const result = callEntry(defaultFn, { metaData, ctx })

      // 验证结果
      expect(result).toBe('custom: default')
    })

    it('应该支持具有entry属性的方法对象', () => {
      // 定义一个默认方法
      const defaultFn = () => 'default'

      // 定义一个带有entry属性的自定义方法对象
      const customObj = {
        entry: (ctx: any, fn: () => string) => {
          return 'custom entry: ' + fn()
        }
      }

      // 注册自定义方法对象
      entryHashMap['test.id'] = customObj

      // 创建metaData和ctx
      const metaData = { id: 'test.id' }
      const ctx = {}

      // 调用callEntry
      const result = callEntry(defaultFn, { metaData, ctx })

      // 验证结果
      expect(result).toBe('custom entry: default')
    })

    it('如果没有找到自定义方法，应该返回默认方法', () => {
      // 定义一个默认方法
      const defaultFn = () => 'default'

      // 创建metaData和ctx，使用不存在的ID
      const metaData = { id: 'non.existing.id' }
      const ctx = {}

      // 调用callEntry
      const result = callEntry(defaultFn, { metaData, ctx })

      // 验证返回的是原始的默认方法
      expect(result).toBe(defaultFn)
      expect(result()).toBe('default')
    })
  })

  describe('beforeCallEntry 和 afterCallEntry', () => {
    it('应该调用before和after钩子函数', () => {
      // 创建钩子函数
      const beforeHook = vi.fn()
      const afterHook = vi.fn()

      // 创建带有before和after的对象
      const hookObj = {
        before: beforeHook,
        after: afterHook
      }

      // 注册钩子对象
      entryHashMap['test.hooks'] = hookObj

      // 创建metaData和ctx
      const metaData = { id: 'test.hooks' }
      const ctx = { data: 'test' }

      // 调用钩子函数
      beforeCallEntry({ metaData, ctx })
      afterCallEntry({ metaData, ctx })

      // 验证钩子函数被调用
      expect(beforeHook).toHaveBeenCalledWith(ctx)
      expect(afterHook).toHaveBeenCalledWith(ctx)
    })

    it('如果没有找到钩子函数，不应该抛出错误', () => {
      // 创建metaData和ctx，使用不存在的ID
      const metaData = { id: 'non.existing.hooks' }
      const ctx = {}

      // 调用钩子函数不应该抛出错误
      expect(() => beforeCallEntry({ metaData, ctx })).not.toThrow()
      expect(() => afterCallEntry({ metaData, ctx })).not.toThrow()
    })
  })

  describe('fetchHotfixRegistry', () => {
    beforeEach(() => {
      // 重置所有模拟
      vi.resetAllMocks()
    })

    it('应该从JS文件中获取注册表', async () => {
      // 创建临时文件
      const tempDir = tmpdir()
      const tempFilePath = join(tempDir, `hotfix-${Date.now()}.js`)
      const fileContent = `export default { id: 'hotfix' };`

      // 写入临时文件
      writeFileSync(tempFilePath, fileContent, 'utf-8')

      // 构建文件URL
      const fileUrl = `file://${tempFilePath.replace(/\\/g, '/')}`

      // 模拟fetch响应头
      const mockFetch = vi.fn()
      vi.stubGlobal('fetch', mockFetch)

      mockFetch.mockReturnValueOnce(
        Promise.resolve({
          headers: {
            get: (name: string) => (name === 'content-type' ? 'application/javascript' : null)
          }
        })
      )

      try {
        // 调用函数
        const result = await fetchHotfixRegistry(fileUrl)

        // 验证结果
        expect(result).toEqual({ id: 'hotfix' })
        expect(mockFetch).toHaveBeenCalledWith(fileUrl, { method: 'HEAD' })
      } finally {
        // 测试完成后删除临时文件
        unlinkSync(tempFilePath)
      }
    })

    it('应该从JSON文件中获取注册表', async () => {
      // 模拟fetch响应头
      const mockFetch = vi.fn()
      vi.stubGlobal('fetch', mockFetch)

      mockFetch.mockReturnValueOnce(
        Promise.resolve({
          headers: {
            get: (name: string) => (name === 'content-type' ? 'application/json' : null)
          }
        })
      )

      // 使用HTTP URL
      const httpUrl = `https://example.com/hotfix.json`

      // 模拟fetch数据响应
      mockFetch.mockReturnValueOnce(
        Promise.resolve({
          json: () =>
            Promise.resolve({
              id: 'hotfix-json',
              overwrite: {
                methods: {
                  '': {
                    jsonMethod: () => 'json-method-result'
                  },
                  file1: {
                    jsonFileMethod: () => 'json-file-method-result'
                  }
                },
                lifeCycles: {
                  '': {
                    onMounted: () => 'json-mounted'
                  }
                },
                templates: {
                  '': '<div>JSON Template</div>'
                }
              }
            })
        })
      )

      // 调用函数
      const result = await fetchHotfixRegistry(httpUrl)

      // 验证结果
      expect(result).toEqual({
        id: 'hotfix-json',
        overwrite: {
          methods: {
            '': {
              jsonMethod: expect.any(Function)
            },
            file1: {
              jsonFileMethod: expect.any(Function)
            }
          },
          lifeCycles: {
            '': {
              onMounted: expect.any(Function)
            }
          },
          templates: {
            '': '<div>JSON Template</div>'
          }
        }
      })
      expect(mockFetch).toHaveBeenCalledWith(httpUrl, { method: 'HEAD' })
      expect(mockFetch).toHaveBeenCalledWith(httpUrl)
    })

    it('应该在文件类型检查失败时抛出错误', async () => {
      // 模拟fetch失败
      const mockFetch = vi.fn()
      vi.stubGlobal('fetch', mockFetch)

      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      // 使用不存在的HTTP URL
      const httpUrl = `https://example.com/non-existent-file.js`

      // 调用函数应该抛出错误
      await expect(fetchHotfixRegistry(httpUrl)).rejects.toThrow(
        '[hotfix registry] fetch registry failed, please check the url is valid'
      )
    })
  })

  describe('initHotfixRegistry', () => {
    it('应该初始化热修复注册表', async () => {
      // 创建一个模拟的request函数
      const mockRequest = vi.fn().mockResolvedValue({
        'engine.hotfix': {
          id: 'engine.hotfix',
          overwrite: {
            methods: {
              '': {
                hotfixMethod: () => 'hotfixed'
              }
            }
          }
        }
      })

      // 使用file协议URL (Node.js环境中动态import只能使用file协议)
      const fileUrl = 'file:///path/to/hotfix.js'

      // 调用initHotfixRegistry
      const result = await initHotfixRegistry({
        url: fileUrl,
        request: mockRequest
      })

      // 验证request被调用
      expect(mockRequest).toHaveBeenCalledWith(fileUrl)

      // 验证返回值
      expect(result).toBeDefined()
      expect(result['engine.hotfix'].id).toBe('engine.hotfix')

      // 验证方法被注册
      expect(entryHashMap['engine.hotfix.hotfixMethod']).toBeDefined()
      expect(typeof entryHashMap['engine.hotfix.hotfixMethod']).toBe('function')
    })

    it('在请求失败时应该忽略错误', async () => {
      // 创建一个失败的模拟request函数
      const mockRequest = vi.fn().mockRejectedValue(new Error('Failed to fetch'))

      // 模拟console.warn
      const originalWarn = console.warn
      console.warn = vi.fn()

      try {
        // 调用initHotfixRegistry
        const result = await initHotfixRegistry({
          url: 'https://example.com/non-existent.js',
          request: mockRequest
        })

        // 验证请求被调用
        expect(mockRequest).toHaveBeenCalledWith('https://example.com/non-existent.js')

        // 验证返回值为undefined
        expect(result).toBeUndefined()

        // 验证警告消息被记录
        expect(console.warn).toHaveBeenCalledWith(
          '[hotfix registry] Failed to load and register registry. Please verify the URL is valid'
        )
      } finally {
        // 恢复原始的console.warn
        console.warn = originalWarn
      }
    })
  })
})
