import { expect, test, beforeEach, afterEach, vi } from 'vitest'
import { genSFCWithDefaultPlugin } from '@/generator/vue/sfc'
import pageSchema from './page.schema.json'
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

test('should generate template quote correctly', async () => {
  const res = genSFCWithDefaultPlugin(pageSchema, [])

  const formattedCode = formatCode(res, 'vue')

  await expect(formattedCode).toMatchFileSnapshot('./expected/templateQuote.vue')
})
