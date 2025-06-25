import { expect, test } from 'vitest'
import { genSFCWithDefaultPlugin } from '@/generator/vue/sfc'
import schema from './page.schema.json'
import blockSchema from './blocks.schema.json'
import componentsMap from './components-map.json'
import { formatCode } from '@/utils/formatCode'

test('should generate useStateAccessor Correct', async () => {
  const res = genSFCWithDefaultPlugin(schema, componentsMap)
  const formattedCode = formatCode(res, 'vue')

  await expect(formattedCode).toMatchFileSnapshot('./expected/UseStateAccessor.vue')
})

test('should generate block state accessor correct', async () => {
  const res = genSFCWithDefaultPlugin(blockSchema, componentsMap)
  const formattedCode = formatCode(res, 'vue')

  await expect(formattedCode).toMatchFileSnapshot('./expected/StateAccessor.vue')
})
