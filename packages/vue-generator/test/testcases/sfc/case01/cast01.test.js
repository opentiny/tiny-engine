import { expect, test } from 'vitest'
import { genSFCWithDefaultPlugin } from '@/generator/vue/sfc'
import schema from './schema.json'
import componentsMap from './componentsMap.json'
import expectedRes from './expected.vue?raw'

console.log('case01', typeof expectedRes)

test('should validate tagName', () => {
  expect(genSFCWithDefaultPlugin(schema, componentsMap)).toBe('')
})
