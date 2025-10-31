# @opentiny/tiny-engine-react-to-dsl

> 将 React 代码（JSX）反向转换为 TinyEngine DSL Schema 的工具包

## 简介

`@opentiny/tiny-engine-react-to-dsl` 解析 React 组件源码，生成可用于 TinyEngine 的 DSL Schema（IAppSchema）。当前聚焦“单文件源码 → 单个 Page/Block 的 Schema”，便于在设计器或运行时加载。

## 主要特性

- 解析 JSX/TSX，生成 children 树；JS 表达式以 `{ type: 'JSExpression', value }` 保留
- 提取函数组件体内的函数声明/箭头函数为 `page.methods`
- 支持类组件的生命周期方法（如 componentDidMount 等）与类方法提取
- 识别最常见的 `arr.map(x => <JSX />)` 简单循环为 `node.loop`
- 支持 `props.style` 对象到 CSS 字符串的规范化
- 内置组件名映射（如 `Form` -> `TinyForm`、`Input` -> `TinyInput` 等），含个别图标特殊映射
- 可注入样式字符串（整合外部 .css 内容）
- TypeScript 实现并导出类型；提供 Vitest 单测与用例输出

## 安装

```bash
pnpm add @opentiny/tiny-engine-react-to-dsl
```

## 目录结构

```text
src/
├─ index.ts        # 包导出入口（types 与 transform）
├─ transform.ts    # 核心转换：React 源码 -> IAppSchema
├─ types.ts        # DSL 相关类型（IAppSchema/IPageSchema/JSExpression 等）
├─ constants.ts    # 组件名映射（React 组件名 -> Tiny 组件名）
└─ utils.ts        # 工具函数（如 8 位 id 生成）

test/
├─ basic/          # 基础单测（Vitest）
└─ testcases/      # 集成用例：输入 jsx/css，输出 app/page schema.json
```

## 快速开始

```ts
import { transformReactToDsl } from '@opentiny/tiny-engine-react-to-dsl'

const code = `
export default function App(){
  return <div className="box"><h1 title="t">Hello</h1></div>
}
`

const app = transformReactToDsl(code, { filename: 'App.jsx' })
// Page Schema
console.log(app.pageSchema[0])
// children 树
console.log(app.pageSchema[0].children)
```

注入额外 CSS 并输出为 Block：

```ts
const css = `.box { color: #333; }`
const app = transformReactToDsl(code, { filename: 'App.jsx', css })
console.log(app.pageSchema[0])
```

## API

函数：

```ts
function transformReactToDsl(code: string, options?: TransformOptions): IAppSchema
```

参数（TransformOptions）：

- filename?: string — 源码文件名（用于填充 `page.fileName`）
- isBlock?: boolean — 是否输出 Block（默认输出 Page）
- css?: string | string[] — 附加样式内容（可传入多段 CSS 合并）

返回：`IAppSchema`，结构要点：

- `pageSchema: [ IPageSchema ]`：当前只生成一个 Page/Block
- `page.children: ISchemaChildrenItem[]`：由 JSX 转换而来
- `page.methods`：从组件体内识别的函数/方法
- `page.lifeCycles`：类组件生命周期
- `i18n/utils/dataSource/globalState/componentsMap/meta`：预留/占位（按需扩展）

类型：从包入口导出，详见 `src/types.ts`。

## 组件映射（默认）

定义于 `src/constants.ts`，示例：

- Form -> TinyForm
- Form.Item -> TinyFormItem
- Button -> TinyButton
- Radio.Group -> TinyButtonGroup
- Select -> TinySelect
- Input.Search -> TinySearch
- Input -> TinyInput
- Grid -> TinyGrid
- Grid.Item -> TinyGridItem
- Col -> TinyCol
- Row -> TinyRow
- Steps -> TinyTimeLine
- Typography.Text -> Text

特殊处理：当遇到 `DatabaseOutlined` 时，会映射为 `Icon`，并附加 `props.name = 'IconPanelMini'`。

集成用例会把转换结果写入 `test/testcases/**/output/` 下的 `app.schema.json` 与 `page.schema.json`，便于对比与调试。

## 构建

```bash
pnpm build
```

## 测试

使用 Vitest 进行单元与集成测试：

```bash
pnpm install
pnpm test
# 或
npx vitest run
```

### 测试用例说明

集成用例位于 `test/testcases/`，每个用例目录遵循：

- `input/`：包含 1 个 `.jsx/.tsx` 源文件与可选的 `.css` 文件（会被拼接后注入到 `page.css`）
- `output/`：测试执行后会生成 `app.schema.json` 与首个 `page.schema.json`，便于对照查看

具体用例与断言覆盖点：

- 001_normal
  - 覆盖点：
    - CSS 注入：校验注入的样式中包含 `.main-body`
    - Tiny 组件存在：`TinyForm`、`TinyGrid` 等
    - 列表渲染识别：`state.buttons.map(...)` 识别为子节点的 `loop: { type: 'JSExpression', value: 'state.buttons' }`
    - 方法提取：`getTableData`、`handleSearch` 被收集到 `page.methods`

- 002_data-binding
  - 覆盖点：
    - 数据绑定保持表达式：`value` 与 `checked` 转为 `{ type: 'JSExpression', value: 'state.xxx' }`

- 003_createVM
  - 覆盖点：
    - 组件名映射（antd -> Tiny）：
      - `Steps -> TinyTimeLine`
      - `Input.Search -> TinySearch`
      - `Radio.Group -> TinyButtonGroup`
      - `Select -> TinySelect`
    - 图标特殊映射：`DatabaseOutlined -> Icon` 且 `props.name = 'IconPanelMini'`
    - 样式规范化：对象样式被转为字符串（如 `padding-bottom: 10px`）

- 004_lifecycle
  - 覆盖点：
    - 类组件生命周期提取：`componentDidMount`、`componentWillUnmount`、`componentDidUpdate`、`componentDidCatch`
    - 类字段方法提取：`handleClick` 出现在 `page.methods`