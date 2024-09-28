import { expect, test } from 'vitest'
import { isOmitValue } from '../src/utils'

test('should not be array or object value', () => {
  expect(isOmitValue(null)).toBe(true)
  expect(isOmitValue(undefined)).toBe(true)
  expect(isOmitValue('')).toBe(true)
})

test('should be array value', () => {
  expect(isOmitValue([])).toBe(true)
  expect(isOmitValue([1, 2, 3], true)).toBe(false)
})

test('should be object value', () => {
  expect(isOmitValue({})).toBe(true)
  expect(isOmitValue({ name: 'astro', id: 1 })).toBe(false)
})
