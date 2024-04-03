import fs from 'fs'
import path from 'path'
import { expect, test } from 'vitest'
import { genSFCWithDefaultPlugin } from '@/generator/vue/sfc'
import schema from './schema.json'
import blockSchema from './blocks.schema.json'
import componentsMap from './componentsMap.json'
import { formatCode } from '@/utils/formatCode'

// import expectedRes from './expected.vue?raw'

// console.log('case01', typeof expectedRes)

test('should validate tagName', async () => {
  const res = genSFCWithDefaultPlugin(schema, componentsMap)
  const formattedCode = formatCode(res, 'vue')

  fs.writeFileSync(path.resolve(__dirname, 'res.vue'), formattedCode)
  await expect(formattedCode).toMatchFileSnapshot('./expected.vue')
  // expect(res).toBe('')
})

test('should generate block component correct', async () => {
  const res = genSFCWithDefaultPlugin(blockSchema, componentsMap)
  const formattedCode = formatCode(res, 'vue')
  fs.writeFileSync(path.resolve(__dirname, 'ImageTitleRes.vue'), formattedCode)
  await expect(formattedCode).toMatchFileSnapshot('./ImageTitle.vue')

  // expect(res).toBe('')
})
