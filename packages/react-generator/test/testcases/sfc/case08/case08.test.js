import { expect, test } from 'vitest'
import { genSFCWithDefaultPlugin } from '@/generator/vue/sfc'
import schema from './page.schema.json'
import componentsMap from './componentsMap.json'
import { formatCode } from '@/utils/formatCode'

test('should use [suffix-icon] as icon relative attr', async () => {
  const res = genSFCWithDefaultPlugin(schema, componentsMap)
  const formattedCode = formatCode(res, 'vue')

  await expect(formattedCode).toMatchFileSnapshot('./expected/iconTest.vue')
})
