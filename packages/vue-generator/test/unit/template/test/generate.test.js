import { expect, test } from 'vitest'
import { generateTag } from '@/generator/vue/sfc/generateTag'

test('should validate tagName', () => {
  expect(generateTag('')).toBe('')
})

test('should generate start tag correctly', () => {
  expect(generateTag('div', { isStartTag: true })).toBe('<div >')
})

test('should generate close tag correctly', () => {
  expect(generateTag('div', { isStartTag: false })).toBe('</div>')
})

test('void element should generate self close tag', () => {
  expect(generateTag('img')).toBe('<img />')
  expect(generateTag('input')).toBe('<input />')
  expect(generateTag('br')).toBe('<br />')
  expect(generateTag('hr')).toBe('<hr />')
  expect(generateTag('link')).toBe('<link />')
  expect(generateTag('area')).toBe('<area />')
  expect(generateTag('base')).toBe('<base />')
  expect(generateTag('col')).toBe('<col />')
  expect(generateTag('embed')).toBe('<embed />')
  expect(generateTag('meta')).toBe('<meta />')
  expect(generateTag('source')).toBe('<source />')
  expect(generateTag('track')).toBe('<track />')
  expect(generateTag('wbr')).toBe('<wbr />')
  // should respect config
  expect(generateTag('div', { isVoidElement: true })).toBe('<div />')
})

test('should default transform to hyphenate style', () => {
  expect(generateTag('TinyFormItem', { isStartTag: true })).toBe('<tiny-form-item >')
})

test('should generate attribute', () => {
  const attribute = ':class=["test"] v-model="state.formItem" @click="handleClick"'
  expect(generateTag('TinyFormItem', { isStartTag: true, attribute })).toBe(`<tiny-form-item ${attribute}>`)
})
