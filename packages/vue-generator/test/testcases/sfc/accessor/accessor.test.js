import { expect, test } from 'vitest'
import { genSFCWithDefaultPlugin } from '@/generator/vue/sfc'
import schema from './schema.json'
import { formatCode } from '@/utils/formatCode'

test('should validate tagName', async () => {
  const res = genSFCWithDefaultPlugin(schema, [])
  const formattedCode = formatCode(res, 'vue')

  await expect(formattedCode).toMatchFileSnapshot('./expected/Accessor.vue')
})
