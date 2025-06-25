import { describe, expect, test } from 'vitest'
import { hasJsx } from '@/utils/hasJsx'

describe('normal case', () => {
  test('raw jsx should be true', () => {
    expect(hasJsx('<div></div>')).toBe(true)
  })

  test('fragment jsx should be true', () => {
    expect(hasJsx('<><div></div></>')).toBe(true)
  })

  test('only fragment jsx should be true', () => {
    expect(hasJsx('<>helloworld</>')).toBe(true)
  })

  test('function with jsx should be true', () => {
    expect(hasJsx('function foo() { return <div>hello world</div> }')).toBe(true)
  })

  test('params with anonymous function should be true', () => {
    expect(
      hasJsx(
        'function message() { this.utils.Modal.alert({ message: () => <div style="color: red">helloworld</div> }) }'
      )
    ).toBe(true)
  })

  test('jsx inside script tag should be true', () => {
    expect(
      hasJsx(
        '<script setup>function message() { this.utils.Modal.alert({ message: () => <div style="color: red">helloworld</div> }) }</script>'
      )
    ).toBe(true)
  })

  test('jsx with custom element should be true', () => {
    expect(hasJsx('<Modal style="color: red">helloworld</Modal>')).toBe(true)
  })

  test('combo example should be true', () => {
    expect(
      hasJsx(
        '<script setup>function message() { this.utils.Modal.alert({ message: () => <><Modal style="color: red">helloworld</Modal></> }) }</script>'
      )
    ).toBe(true)
  })
})
