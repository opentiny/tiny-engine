import { parse } from '@babel/parser'
import traverse from '@babel/traverse'

export function hasJsx(code) {
  try {
    const ast = parse(code, { plugins: ['jsx'] })
    let res = false

    traverse(ast, {
      JSXElement(path) {
        res = true
        path.stop()
      },
      JSXFragment(path) {
        res = true
        path.stop()
      }
    })

    return res
  } catch (error) {
    // 解析失败则认为不存在 jsx
    return false
  }
}
