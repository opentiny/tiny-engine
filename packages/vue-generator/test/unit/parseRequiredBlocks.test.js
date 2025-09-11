import { expect, test } from 'vitest'
import { parseRequiredBlocks } from '@/utils/parseRequiredBlocks'

test('should return empty array when children is no array', () => {
  expect(parseRequiredBlocks()).toStrictEqual([])
  expect(parseRequiredBlocks({})).toStrictEqual([])
  expect(parseRequiredBlocks({ children: null })).toStrictEqual([])
})

test('should recursive parse children', () => {
  const mockData = {
    children: [
      {
        componentType: 'Block',
        componentName: 'Header',
        children: [
          {
            componentType: 'Block',
            componentName: 'MenuList'
          }
        ]
      },
      {
        componentName: 'div',
        children: [
          {
            componentName: 'div',
            children: [
              {
                componentName: 'div',
                children: [
                  {
                    componentType: 'Block',
                    componentName: 'Container'
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }

  expect(parseRequiredBlocks(mockData)).toStrictEqual(['Header', 'MenuList', 'Container'])
})

test('should parse blocks from props with JSSlot and NodeLike, children before props', () => {
  const mock = {
    componentName: 'Root',
    props: {
      // JSSlot，包含一个 Block 与一个非节点
      slotA: {
        type: 'JSSlot',
        value: [{ componentName: 'X', componentType: 'Block' }, 'text']
      },
      // 普通对象里包含 NodeLike（无 children 也可）
      nest: {
        deep: [{ componentName: 'Y', componentType: 'Block' }]
      }
    },
    children: [{ componentName: 'C1', componentType: 'Block' }]
  }

  expect(parseRequiredBlocks(mock)).toStrictEqual(['C1', 'X', 'Y'])
})

test('should respect props depth limit and avoid cycles', () => {
  const deep = {}
  let cur = deep
  // 构造深链 > 1000，使末端的 Block 不被解析
  for (let i = 0; i < 1005; i++) {
    cur.next = {}
    cur = cur.next
  }
  cur.next = { componentName: 'TooDeep', componentType: 'Block' }

  // 循环引用
  const a = {}
  const b = { a }
  a.b = b

  const mock = {
    componentName: 'Root',
    props: {
      deep,
      cycle: a
    },
    children: []
  }

  expect(parseRequiredBlocks(mock)).toStrictEqual([])
})
