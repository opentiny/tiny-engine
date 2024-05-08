import { expect, test } from 'vitest'
import { delNullKey } from '../src/utils'

test('should not be object value', () => {
  expect(delNullKey(12, { deep: true, keepRef: false })).toBe(12)
  expect(delNullKey('AB', { deep: true, keepRef: false })).toBe('AB')
  expect(delNullKey(true, { deep: true, keepRef: false })).toBe(true)
})

const testObj = {
  number1: 1,
  number2: 0,
  string1: '1',
  string2: '',
  nullValue: null,
  undefineValue: undefined,
  array1: [],
  array2: [1, 2, 3],
  object1: {},
  object2: { name: 'zh', id: 1 },
  object3: {
    inside: {
      insideString: '',
      insideNull: null,
      insideUndefined: undefined,
      insideStringNotEmpty: '12'
    }
  }
}

test('should be object value, deep is false', () => {
  expect(delNullKey(testObj, { deep: false, keepRef: false })).toBe({
    number1: 1,
    number2: 0,
    string1: '1',
    array1: [],
    array2: [1, 2, 3],
    object1: {},
    object2: { name: 'zh', id: 1 },
    object3: {
      inside: {
        insideString: '',
        insideNull: null,
        insideUndefined: undefined,
        insideStringNotEmpty: '12'
      }
    }
  })
})

test('should be object value, keepRef is false', () => {
  expect(delNullKey(testObj, { deep: true, keepRef: false })).toBe({
    number1: 1,
    number2: 0,
    string1: '1',
    array1: [],
    array2: [1, 2, 3],
    object1: {},
    object2: { name: 'zh', id: 1 },
    object3: {
      inside: {
        insideStringNotEmpty: '12'
      }
    }
  })
})

test('should be object value, keepRef is true', () => {
  expect(delNullKey(testObj, { deep: true, keepRef: true })).toBe({
    number1: 1,
    number2: 0,
    string1: '1',
    array2: [1, 2, 3],
    object2: { name: 'zh', id: 1 },
    object3: {
      inside: {
        insideStringNotEmpty: '12'
      }
    }
  })
})
