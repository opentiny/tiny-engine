import { describe, it, expect } from 'vitest'
import * as Y from 'yjs'
import { toYjs, fromYjs, sanitizeSchema } from '../../src/utils/index.ts'

describe('Yjs Data Conversion Utilities: toYjs & fromYjs', () => {
  /**
   * 这是一个辅助函数，用于执行完整的“往返”测试。
   * 它接收一个普通的 JavaScript 对象/数组，将其转换为 Yjs 格式，然后再转换回来，
   * 最后断言转换后的结果与原始输入完全一致。
   * @param data 原始的 JavaScript 数据
   */
  const runRoundTripTest = (data: any) => {
    const ydoc = new Y.Doc()
    let yTarget: Y.Map<any> | Y.Array<any>

    // 根据数据类型选择 Yjs 的根容器
    if (Array.isArray(data)) {
      yTarget = ydoc.getArray('data')
    } else {
      yTarget = ydoc.getMap('data')
    }

    // 1. 转换到 Yjs
    toYjs(yTarget, data)

    // 2. 从 Yjs 转换回来
    const convertedData = fromYjs(yTarget)

    // 3. 验证往返后的数据是否与原始数据一致
    expect(convertedData).toEqual(data)
  }

  // --- 测试用例集 ---

  it('应该能正确处理包含各种基本类型的扁平对象', () => {
    const data = {
      string: 'hello world',
      number: 42,
      booleanTrue: true,
      booleanFalse: false,
      nullValue: null
    }
    runRoundTripTest(data)
  })

  it('应该能正确处理包含 undefined 值的对象', () => {
    const data = {
      propA: 'defined value',
      propB: undefined
    }
    runRoundTripTest(data)
  })

  it('应该能正确处理包含各种基本类型的扁平数组', () => {
    const data = ['string', 123, true, null, undefined]
    runRoundTripTest(data)
  })

  it('应该能正确处理嵌套对象', () => {
    const data = {
      level1: {
        prop: 'value',
        level2: {
          num: 99,
          isNested: true
        }
      }
    }
    runRoundTripTest(data)
  })

  it('应该能正确处理嵌套数组', () => {
    const data = [1, ['a', 'b'], [3, [true, null]]]
    runRoundTripTest(data)
  })

  it('应该能正确处理复杂的、混合嵌套的对象和数组（模拟真实 schema）', () => {
    const complexSchema = {
      id: 'page-1',
      componentName: 'Page',
      props: {
        title: 'My Awesome Page',
        style: {
          padding: 20,
          backgroundColor: undefined // 包含 undefined
        }
      },
      children: [
        {
          id: 'container-1',
          componentName: 'Container',
          children: [
            { id: 'button-1', componentName: 'Button', props: { text: 'Click Me' } },
            { id: 'text-1', componentName: 'Text', props: { content: null } } // 包含 null
          ]
        }
      ]
    }
    runRoundTripTest(complexSchema)
  })

  // 测试用例中失败的部分

  it('当输入类型与 Yjs 目标容器类型不匹配时，应该抛出错误', () => {
    const ydoc = new Y.Doc()
    const ymap = ydoc.getMap('map')
    const yarray = ydoc.getArray('array')

    const objectData = { a: 1 }
    const arrayData = [1, 2, 3]

    // 错误场景1：尝试将数组写入 Y.Map
    // 函数会先判断输入是数组，然后发现目标不是 Y.Array，所以抛出 'Expected Y.Array...'
    // ★★★ 这里是需要修改的地方 ★★★
    expect(() => toYjs(ymap, arrayData)).toThrow('Expected Y.Array as target for array input')

    // 错误场景2：尝试将对象写入 Y.Array
    // 函数会判断输入是对象，然后发现目标不是 Y.Map，所以抛出 'Expected Y.Map...'
    expect(() => toYjs(yarray, objectData)).toThrow('Expected Y.Map as target for object input')
  })

  it('应该能正确处理空对象和空数组', () => {
    runRoundTripTest({})
    runRoundTripTest([])
  })
})

describe('sanitizeSchema', () => {
  // 定义一个常量，用于在所有测试中共享的过滤键列表
  const INTERNAL_KEYS = ['meta', '_methods_deleted', 'newNode']

  // --- 测试基本数据类型 ---
  it('应该原样返回非对象值 (null, string, number, boolean)', () => {
    expect(sanitizeSchema(null, INTERNAL_KEYS)).toBeNull()
    expect(sanitizeSchema('A simple string', INTERNAL_KEYS)).toBe('A simple string')
    expect(sanitizeSchema(42, INTERNAL_KEYS)).toBe(42)
    expect(sanitizeSchema(true, INTERNAL_KEYS)).toBe(true)
  })

  // --- 测试核心功能：软删除过滤 ---
  describe('软删除 (_node_deleted) 过滤', () => {
    it('应该直接移除被标记为软删除的对象，返回 undefined', () => {
      const schema = { id: 'node-1', componentName: 'Button', _node_deleted: true }
      expect(sanitizeSchema(schema, INTERNAL_KEYS)).toBeUndefined()
    })

    it('应该从数组中彻底移除被软删除的节点', () => {
      const schema = [
        { id: 'node-1', componentName: 'Button' },
        { id: 'node-2', componentName: 'Card', _node_deleted: true },
        { id: 'node-3', componentName: 'Input' }
      ]
      const expected = [
        { id: 'node-1', componentName: 'Button' },
        { id: 'node-3', componentName: 'Input' }
      ]
      expect(sanitizeSchema(schema, INTERNAL_KEYS)).toEqual(expected)
    })

    it('如果一个父节点被软删除，其所有子节点（无论是否标记）都应该随之消失', () => {
      const schema = {
        id: 'root',
        componentName: 'Page',
        children: [
          {
            id: 'container-1',
            componentName: 'Container',
            _node_deleted: true, // 父节点被删除
            children: [{ id: 'button-1', componentName: 'Button' }] // 子节点应该也消失
          },
          { id: 'footer-1', componentName: 'Footer' }
        ]
      }
      const expected = {
        id: 'root',
        componentName: 'Page',
        children: [{ id: 'footer-1', componentName: 'Footer' }]
      }
      expect(sanitizeSchema(schema, INTERNAL_KEYS)).toEqual(expected)
    })
  })

  // --- 测试内部键过滤 ---
  describe('内部键 (keysToFilter) 过滤', () => {
    it('应该从对象顶层移除所有指定的内部键', () => {
      const schema = {
        id: 'node-1',
        componentName: 'Button',
        meta: { author: 'Manus' },
        newNode: true
      }
      const expected = {
        id: 'node-1',
        componentName: 'Button'
      }
      expect(sanitizeSchema(schema, INTERNAL_KEYS)).toEqual(expected)
    })

    it('应该递归地从嵌套对象和数组中移除内部键', () => {
      const schema = {
        id: 'root',
        componentName: 'Page',
        meta: 'root-meta',
        children: [
          {
            id: 'card-1',
            componentName: 'Card',
            _methods_deleted: { some: 'info' },
            props: {
              title: 'My Card',
              meta: 'prop-meta' // props 里的 meta 也应该被移除
            }
          }
        ]
      }
      const expected = {
        id: 'root',
        componentName: 'Page',
        children: [
          {
            id: 'card-1',
            componentName: 'Card',
            props: {
              title: 'My Card'
            }
          }
        ]
      }
      expect(sanitizeSchema(schema, INTERNAL_KEYS)).toEqual(expected)
    })
  })

  // --- 测试特殊逻辑和边缘情况 ---
  describe('特殊逻辑和边缘情况', () => {
    it('如果一个对象的所有属性都被过滤掉，它应该返回 undefined', () => {
      const schema = {
        meta: 'some-data',
        newNode: true
      }
      // 因为所有属性都被过滤，对象变空，最终返回 undefined
      expect(sanitizeSchema(schema, INTERNAL_KEYS)).toBeUndefined()
    })

    it('在数组中，完全由内部键组成的对象应该被移除', () => {
      const schema = [
        { id: 'node-1', componentName: 'Button' },
        { meta: 'only-meta-node' }, // 这个对象会被净化为 undefined
        { id: 'node-3', componentName: 'Input' }
      ]
      const expected = [
        { id: 'node-1', componentName: 'Button' },
        { id: 'node-3', componentName: 'Input' }
      ]
      expect(sanitizeSchema(schema, INTERNAL_KEYS)).toEqual(expected)
    })

    it('应该正确处理 `keysToFilter` 为空或 undefined 的情况', () => {
      const schema = { id: '1', meta: 'data', componentName: 'Button' }

      // 当 keysToFilter 为 undefined 时，不应该过滤任何键
      expect(sanitizeSchema(schema, undefined)).toEqual(schema)

      // 当 keysToFilter 为空数组时，也不应该过滤任何键
      expect(sanitizeSchema(schema, [])).toEqual(schema)
    })

    it('不应该修改原始的 schema 对象 (保持纯函数特性)', () => {
      const originalSchema = {
        id: '1',
        componentName: 'Button',
        meta: { data: 'secret' },
        _node_deleted: false,
        children: [{ id: '2', _node_deleted: true }]
      }
      // 创建一个深拷贝用于比较
      const schemaCopy = JSON.parse(JSON.stringify(originalSchema))

      sanitizeSchema(originalSchema, INTERNAL_KEYS)

      // 检查原始对象在净化后是否保持不变
      expect(originalSchema).toEqual(schemaCopy)
    })

    // 这个测试用例是针对你函数中一个非常特殊的逻辑
    it('如果一个对象只有一个键 "id"，并且这个 "id" 键本身在过滤列表中，则该对象应被移除', () => {
      const schema = { id: 'special-case' }
      const keysWithId = [...INTERNAL_KEYS, 'id'] // 假设 'id' 也是一个要过滤的内部键

      // 因为对象唯一的键 'id' 被过滤了，对象变空，最终返回 undefined
      expect(sanitizeSchema(schema, keysWithId)).toBeUndefined()
    })
  })
})
