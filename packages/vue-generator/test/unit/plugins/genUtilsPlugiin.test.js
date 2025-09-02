import { describe, expect, test } from 'vitest'
import genUtilsPlugin from '@/plugins/genUtilsPlugin'

describe('genUtilsPlugin', () => {
  test('should do nothing when utils is not array', () => {
    const plugin = genUtilsPlugin()
    expect(plugin.run({})).toBeUndefined()
    expect(plugin.run({ utils: null })).toBeUndefined()
  })

  test('should generate import for npm util (destructuring true)', () => {
    const plugin = genUtilsPlugin()
    const schema = {
      utils: [
        {
          type: 'npm',
          name: 'request',
          content: {
            package: 'axios',
            exportName: 'axios',
            destructuring: false
          }
        }
      ]
    }

    const result = plugin.run(schema)
    expect(result?.fileType).toBe('js')
    expect(result?.fileName).toBe('utils.js')
    expect(result?.path).toBe('./src')
    expect(result?.fileContent).toContain("import request from 'axios'")
    expect(result?.fileContent).toContain('export { request }')
  })

  test('should generate const for function util', () => {
    const plugin = genUtilsPlugin()
    const schema = {
      utils: [
        {
          type: 'function',
          name: 'sum',
          content: {
            value: '(a, b) => a + b'
          }
        }
      ]
    }

    const result = plugin.run(schema)
    expect(result?.fileContent).toContain('const sum = (a, b) => a + b')
    expect(result?.fileContent).toContain('export { sum }')
  })

  test('should support aliasing npm util via name', () => {
    const plugin = genUtilsPlugin()
    const schema = {
      utils: [
        {
          type: 'npm',
          name: 'dayjs',
          content: {
            package: 'dayjs',
            exportName: 'dayjs',
            destructuring: false
          }
        }
      ]
    }

    const result = plugin.run(schema)
    expect(result?.fileContent).toContain("import dayjs from 'dayjs'")
    expect(result?.fileContent).toContain('export { dayjs }')
  })

  test('should support mixed utils and custom options', () => {
    const plugin = genUtilsPlugin({ path: './custom', fileName: 'my-utils.js' })
    const schema = {
      utils: [
        {
          type: 'npm',
          name: 'request',
          content: {
            package: 'axios',
            exportName: 'axios',
            destructuring: false
          }
        },
        {
          type: 'function',
          name: 'sum',
          content: {
            value: '(a, b) => a + b'
          }
        }
      ]
    }

    const result = plugin.run(schema)
    expect(result?.fileName).toBe('my-utils.js')
    expect(result?.path).toBe('./custom')
    expect(result?.fileContent).toContain("import request from 'axios'")
    expect(result?.fileContent).toContain('const sum = (a, b) => a + b')
    expect(result?.fileContent).toContain('export { request,sum }')
  })

  test('should generate destructuring import without alias for npm util', () => {
    const plugin = genUtilsPlugin()
    const schema = {
      utils: [
        {
          type: 'npm',
          name: 'TinyButton',
          content: {
            package: '@opentiny/vue',
            exportName: 'TinyButton',
            destructuring: true
          }
        }
      ]
    }

    const result = plugin.run(schema)
    expect(result?.fileContent).toContain("import { TinyButton } from '@opentiny/vue'")
    expect(result?.fileContent).toContain('export { TinyButton }')
  })

  test('should generate destructuring import with alias for npm util', () => {
    const plugin = genUtilsPlugin()
    const schema = {
      utils: [
        {
          type: 'npm',
          name: 'TinyButton',
          content: {
            package: '@opentiny/vue',
            exportName: 'Button',
            destructuring: true
          }
        }
      ]
    }

    const result = plugin.run(schema)
    expect(result?.fileContent).toContain("import { Button as TinyButton } from '@opentiny/vue'")
    expect(result?.fileContent).toContain('export { TinyButton }')
  })
})
