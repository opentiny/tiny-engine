import { expect, test, describe } from 'vitest'
import { genSFCWithDefaultPlugin } from '@/generator/vue/sfc'
import schema from './schema.json'
import { formatCode } from '@/utils/formatCode'

describe('should generate state correctly', () => {
  test('should generate state accessor correctly', async () => {
    const res = genSFCWithDefaultPlugin(schema, [])
    const formattedCode = formatCode(res, 'vue')

    await expect(formattedCode).toMatchFileSnapshot('./expected/Accessor.vue')
  })
})
