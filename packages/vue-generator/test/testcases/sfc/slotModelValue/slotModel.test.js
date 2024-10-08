import { expect, test } from 'vitest'
import { genSFCWithDefaultPlugin } from '@/generator/vue/sfc'
import schema from './page.schema.json'
import componentsMap from './components-map.json'
import { formatCode } from '@/utils/formatCode'

test('should generate onUpdate:modelValue event', async () => {
  const res = genSFCWithDefaultPlugin(schema, componentsMap)
  const formattedCode = formatCode(res, 'vue')

  await expect(formattedCode).toMatchFileSnapshot('./expected/slotModelValueTest.vue')
})
