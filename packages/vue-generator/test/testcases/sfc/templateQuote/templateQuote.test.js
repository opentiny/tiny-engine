import { expect, test } from 'vitest'
import { genSFCWithDefaultPlugin } from '@/generator/vue/sfc'
import pageSchema from './page.schema.json'
import scopeSchema from './scope.schema.json'
import multilineSchema from './multiline.schema.json'
import jsxQuoteSchema from './jsxQuote.schema.json'
import jsxQuoteComponentsMap from './jsxQuote.components-map.json'
import primitiveQuoteSchema from './primitiveQuote.schema.json'
import { formatCode } from '@/utils/formatCode'

test('should generate template quote correctly', async () => {
  const res = genSFCWithDefaultPlugin(pageSchema, [])

  const formattedCode = formatCode(res, 'vue')

  await expect(formattedCode).toMatchFileSnapshot('./expected/templateQuote.vue')
})

test('should preserve expression scope and string content with quotes', async () => {
  const res = genSFCWithDefaultPlugin(scopeSchema, [])

  const formattedCode = formatCode(res, 'vue')

  await expect(formattedCode).toMatchFileSnapshot('./expected/quoteScope.vue')
})

test('should escape newlines in v-bind string literals for multiline strings with double quotes', async () => {
  const res = genSFCWithDefaultPlugin(multilineSchema, [])

  const formattedCode = formatCode(res, 'vue')

  await expect(formattedCode).toMatchFileSnapshot('./expected/multiline.vue')
})

test('should not use v-bind string literal syntax in JSX slot mode', async () => {
  const res = genSFCWithDefaultPlugin(jsxQuoteSchema, jsxQuoteComponentsMap)

  const formattedCode = formatCode(res, 'vue')

  await expect(formattedCode).toMatchFileSnapshot('./expected/jsxQuote.vue')
})

test('should encode double quotes as &quot; in primitive string attributes', async () => {
  const res = genSFCWithDefaultPlugin(primitiveQuoteSchema, [])

  const formattedCode = formatCode(res, 'vue')

  await expect(formattedCode).toMatchFileSnapshot('./expected/primitiveQuote.vue')
})
