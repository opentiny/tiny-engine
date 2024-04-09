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
