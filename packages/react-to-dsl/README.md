# @opentiny/tiny-engine-react-to-dsl

将 React 源码（JSX/TSX）转换为 TinyEngine DSL（IAppSchema）。

- 输入：React 组件源码字符串
- 输出：IAppSchema 对象，包含一个 Page 的 children 树（最小能力）

使用示例：

```ts
import { transformReactToDsl } from '@opentiny/tiny-engine-react-to-dsl'

const code = `
export default function App(){
  return <div className="box"><h1 title="t">Hello</h1></div>
}
`

const dsl = transformReactToDsl(code, { filename: 'App.tsx' })
console.log(dsl.pageSchema[0].children)
```

现状：

- 仅支持从函数组件的 return 中提取首个 JSXElement
- JSX 属性、表达式容器会被转成 props 的字面值或 JSExpression
- 文本子节点会转成一个 span 节点

后续可扩展：

- 类组件、Fragment、多返回路径
- 事件与 state、方法、生命周期提取
- 组件依赖收集并填充 componentsMap
