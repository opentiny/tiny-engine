import fs from 'fs'
import path from 'path'
import { expect, test } from 'vitest'
import { genSFCWithDefaultPlugin } from '@/generator/vue/sfc'
import schema from './page.schema.json'
import componentsMap from './components-map.json'
import expectedRes from './UsePropAccessor.vue?raw'
import blockSchema from './blocks.schema.json'

console.log('case02', typeof expectedRes)

test('should validate tagName', () => {
  const res = genSFCWithDefaultPlugin(schema, componentsMap)

  fs.writeFileSync(path.resolve(__dirname, 'Res.vue'), res)
  expect(res).toBe('')
})

test('should generate prop accessor correctly', () => {
  const res = genSFCWithDefaultPlugin(blockSchema, componentsMap)

  fs.writeFileSync(path.resolve(__dirname, 'PropAccessorRes.vue'), res)
  expect(res).toBe('')
})
