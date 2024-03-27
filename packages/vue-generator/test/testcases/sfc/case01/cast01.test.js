import fs from 'fs'
import path from 'path'
import { expect, test } from 'vitest'
import { genSFCWithDefaultPlugin } from '@/generator/vue/sfc'
import schema from './schema.json'
import blockSchema from './blocks.schema.json'
import componentsMap from './componentsMap.json'
import expectedRes from './expected.vue?raw'

console.log('case01', typeof expectedRes)

test('should validate tagName', () => {
  const res = genSFCWithDefaultPlugin(schema, componentsMap)

  fs.writeFileSync(path.resolve(__dirname, 'res.vue'), res)
  expect(res).toBe('')
})

test('should generate block component correct', () => {
  const res = genSFCWithDefaultPlugin(blockSchema, componentsMap)

  fs.writeFileSync(path.resolve(__dirname, 'ImageTitleRes.vue'), res)
  expect(res).toBe('')
})
