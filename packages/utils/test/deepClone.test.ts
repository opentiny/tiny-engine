import { ref, reactive } from 'vue'
import { expect, test } from 'vitest'
import { deepClone } from '../src/utils'

test('should be clone primitive value', () => {
  expect(deepClone(null)).toBe(null)
  expect(deepClone(undefined)).toBe(undefined)
  expect(deepClone('a')).toBe('a')
  expect(deepClone(1)).toBe(1)
  expect(deepClone(false)).toBe(false)
  expect(deepClone(1n)).toBe(1n)
})

test('should be clone simple object', () => {
  const map = new Map()

  map.set('a', 1)
  map.set('b', [1, { b: 2 }])

  const set = new Set()

  set.add(1)
  set.add('2')

  const obj = {
    a: 1,
    b: '2',
    c: true,
    d: false,
    e: 0,
    f: undefined,
    g: null,
    arr: ['a', '', 0, false, { c: 'ccc' }],
    arrLike: { 0: 'a', length: 1 },
    reg: /word/gim,
    date: new Date(),
    map,
    set
  }

  const newObj = deepClone(obj)

  expect(newObj).toStrictEqual(obj)
  expect(newObj !== obj).toBe(true)
  expect(newObj.arr[4] !== obj.arr[4]).toBe(true)
})

test('should be clone map', () => {
  const map = new Map()

  map.set('a', 1)
  map.set('b', [1, { b: 2 }])

  const newMap = deepClone(map)

  expect(map).toStrictEqual(newMap)
  expect(newMap.get('a')).toBe(1)
  expect(newMap.get('b') !== map.get('b')).toBe(true)
  expect(newMap.get('b')).toStrictEqual(map.get('b'))
})

test('should be clone set', () => {
  const set = new Set()

  set.add(1)
  set.add('2')

  const newSet = deepClone(set)

  expect(newSet.size).toBe(2)
  expect(newSet.has(1)).toBe(true)
  expect(newSet.has('2')).toBe(true)
})

test('should be clone with circular reference', () => {
  const obj = {
    foo: { b: { c: { d: {} } } },
    bar: {}
  }

  obj.foo.b.c.d = obj
  obj.bar.b = obj.foo.b

  const newObj = deepClone(obj)

  expect(newObj.bar.b === newObj.foo.b && newObj === newObj.foo.b.c.d && newObj !== obj).toBe(true)
})

test('should be clone with `index` and `input` array properties', () => {
  const arr = /c/.exec('abcde')
  const clonedArr = deepClone(arr)

  expect(clonedArr.index).toBe(2)
  expect(clonedArr.input).toBe('abcde')
})

test('should be clone with ref value', () => {
  const map = new Map()

  map.set('a', 1)
  map.set('b', [1, { b: 2 }])

  const set = new Set()

  set.add(1)
  set.add('2')

  const obj = {
    a: 1,
    b: '2',
    c: true,
    d: false,
    e: 0,
    f: undefined,
    g: null,
    arr: ['a', '', 0, false, { c: 'ccc' }],
    arrLike: { 0: 'a', length: 1 },
    reg: /word/gim,
    date: new Date(),
    map,
    set
  }

  const objRef = ref(obj)

  const newObj = deepClone(objRef)

  expect(newObj).toStrictEqual(obj)
  expect(newObj !== obj && newObj !== objRef.value).toBe(true)
  expect(newObj.arr[4] !== objRef.value.arr[4] && newObj.arr[4].c === objRef.value.arr[4].c).toBe(true)
})

test('should be clone with reactive with inner refs', () => {
  const origin = {
    a: 'a',
    b: 2,
    c: 'c',
    d: ['aaa', 'ad']
  }

  const obj = reactive({
    a: 'a',
    b: 2,
    c: ref('c'),
    d: ['aaa', ref('ad')]
  })

  const newObj = deepClone(obj)
  expect(newObj).toStrictEqual(newObj)
  expect(newObj.d !== origin.d).toBe(true)
})
