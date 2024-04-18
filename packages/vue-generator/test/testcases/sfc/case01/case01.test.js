import { expect, test, beforeEach, afterEach, vi } from 'vitest'
import { genSFCWithDefaultPlugin } from '@/generator/vue/sfc'
import schema from './schema.json'
import blockSchema from './blocks.schema.json'
import componentsMap from './componentsMap.json'
import { formatCode } from '@/utils/formatCode'

let count = 0
const mockValue = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]

beforeEach(() => {
  // 伪随机数，保证每次快照都一致
  vi.spyOn(global.Math, 'random').mockImplementation(() => {
    const res = mockValue[count]

    count++
    if (count > 10) {
      count = 0
    }

    return res
  })
})

afterEach(() => {
  vi.spyOn(global.Math, 'random').mockRestore()
})

test('should validate tagName', async () => {
  const res = genSFCWithDefaultPlugin(schema, componentsMap)
  const formattedCode = formatCode(res, 'vue')

  await expect(formattedCode).toMatchFileSnapshot('./expected/FormTable.vue')
})

test('should generate block component correct', async () => {
  const res = genSFCWithDefaultPlugin(blockSchema, componentsMap)
  const formattedCode = formatCode(res, 'vue')

  await expect(formattedCode).toMatchFileSnapshot('./expected/ImageTitle.vue')
})
