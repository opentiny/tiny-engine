import { describe, it, expect } from 'vitest'
import { formatCode, formatFiles, checkFormat } from '../../src/utils/formatCode'

describe('formatCode', () => {
  describe('JavaScript/JSX 格式化', () => {
    it('应该正确格式化 JavaScript 代码', () => {
      const input = `function test(){const a=1;const b=2;return a+b;}`
      const expected = `function test() {
  const a = 1
  const b = 2
  return a + b
}
`
      const result = formatCode(input, 'test.js')
      expect(result).toBe(expected)
    })

    it('应该正确格式化 JSX 代码', () => {
      const input = `function App(){return(<div><h1>Hello</h1><p>World</p></div>);}`
      const expected = `function App() {
  return (
    <div>
      <h1>Hello</h1>
      <p>World</p>
    </div>
  )
}
`
      const result = formatCode(input, 'App.jsx')
      expect(result).toBe(expected)
    })
  })

  describe('JSON 格式化', () => {
    it('应该正确格式化 JSON 代码', () => {
      const input = `{"name":"test","value":123,"items":[1,2,3]}`
      const expected = `{
  "name": "test",
  "value": 123,
  "items": [
    1,
    2,
    3
  ]
}
`
      const result = formatCode(input, 'config.json')
      expect(result).toBe(expected)
    })
  })

  describe('CSS 格式化', () => {
    it('应该正确格式化 CSS 代码', () => {
      const input = `.test{color:red;font-size:14px;margin:10px 20px;}`
      const expected = `.test {
  color: red;
  font-size: 14px;
  margin: 10px 20px;
}
`
      const result = formatCode(input, 'styles.css')
      expect(result).toBe(expected)
    })
  })

  describe('HTML 格式化', () => {
    it('应该正确格式化 HTML 代码', () => {
      const input = `<div><h1>Title</h1><p>Content</p></div>`
      const expected = `<div>
  <h1>Title</h1>
  <p>Content</p>
</div>
`
      const result = formatCode(input, 'index.html')
      expect(result).toBe(expected)
    })
  })

  describe('错误处理', () => {
    it('应该处理无效的 JavaScript 代码', () => {
      const input = `function test({const a=1;return a;}` // 缺少右括号
      const result = formatCode(input, 'test.js')
      // 格式化失败时应该返回原始代码
      expect(result).toBe(input)
    })

    it('应该处理不支持的文件类型', () => {
      const input = `some content`
      const result = formatCode(input, 'test.txt')
      expect(result).toBe(input)
    })
  })
})

describe('formatFiles', () => {
  it('应该批量格式化多个文件', () => {
    const files = [
      {
        fileName: 'test.js',
        fileContent: `function test(){const a=1;return a;}`
      },
      {
        fileName: 'config.json',
        fileContent: `{"name":"test","value":123}`
      }
    ]

    const result = formatFiles(files)

    expect(result).toHaveLength(2)
    expect(result[0].fileName).toBe('test.js')
    expect(result[1].fileName).toBe('config.json')

    // 验证格式化结果
    expect(result[0].fileContent).toContain('function test()')
    expect(result[1].fileContent).toContain('"name": "test"')
  })

  it('应该处理格式化错误', () => {
    const files = [
      {
        fileName: 'test.js',
        fileContent: `function test({const a=1;return a;}` // 无效代码
      }
    ]

    const result = formatFiles(files)

    expect(result).toHaveLength(1)
    // 格式化失败时应该返回原始文件
    expect(result[0].fileContent).toBe(files[0].fileContent)
  })
})

describe('checkFormat', () => {
  it('应该检测未格式化的代码', () => {
    const input = `function test(){const a=1;return a;}`
    const needsFormat = checkFormat(input, 'test.js')
    expect(needsFormat).toBe(true)
  })

  it('应该检测已格式化的代码', () => {
    const input = `function test() {
  const a = 1
  return a
}
`
    const needsFormat = checkFormat(input, 'test.js')
    expect(needsFormat).toBe(false)
  })

  it('应该处理不支持的文件类型', () => {
    const input = `some content`
    const needsFormat = checkFormat(input, 'test.txt')
    expect(needsFormat).toBe(false)
  })
})
