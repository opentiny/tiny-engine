import { expect, test } from 'vitest'
import { genSFCWithDefaultPlugin } from '@/generator/vue/sfc'
import schema from './page.schema.json'
import componentsMap from './components-map.json'
import blockSchema from './blocks.schema.json'
import { formatCode } from '@/utils/formatCode'

test('should generate use prop accessor correctly', async () => {
  const res = genSFCWithDefaultPlugin(schema, componentsMap)

  const formattedCode = formatCode(res, 'vue')

  await expect(formattedCode).toMatchFileSnapshot('./expected/UsePropAccessor.vue')
})

test('should generate prop accessor correctly', async () => {
  const res = genSFCWithDefaultPlugin(blockSchema, componentsMap)

  const formattedCode = formatCode(res, 'vue')

  await expect(formattedCode).toMatchFileSnapshot('./expected/PropAccessor.vue')
})
