import { expect, test } from 'vitest'
import { genSFCWithDefaultPlugin } from '@/generator/vue/sfc'
import blockSchema from './block.schema.json'
import pageSchema from './page.schema.json'
import { formatCode } from '@/utils/formatCode'

test('should generate slot and pass testData params', async () => {
  const res = genSFCWithDefaultPlugin(blockSchema, [])
  const formattedCode = formatCode(res, 'vue')

  await expect(formattedCode).toMatchFileSnapshot('./expected/slotParamsBlock.vue')
})

test('should generate slot params', async () => {
  const res = genSFCWithDefaultPlugin(pageSchema, [])
  const formattedCode = formatCode(res, 'vue')

  await expect(formattedCode).toMatchFileSnapshot('./expected/slotParamsPage.vue')
})
