import fs from 'fs'
import path from 'path'
import { expect, test } from 'vitest'
import { genSFCWithDefaultPlugin } from '@/generator/vue/sfc'
import schema from './page.schema.json'
import blockSchema from './blocks.schema.json'
import componentsMap from './components-map.json'
// import expectedRes from './expected.vue?raw'

// console.log('case01', typeof expectedRes)

test('should generate useStateAccessorCorrect', () => {
  const res = genSFCWithDefaultPlugin(schema, componentsMap)

  fs.writeFileSync(path.resolve(__dirname, 'UseStateAccessorRes.vue'), res)
  expect(res).toBe('')
})

test('should generate block state accessor correct', () => {
  const res = genSFCWithDefaultPlugin(blockSchema, componentsMap)

  fs.writeFileSync(path.resolve(__dirname, 'StateAccessorRes.vue'), res)
  expect(res).toBe('')
})
