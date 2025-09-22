## 概览

页面 schema 是 TinyEngine 在画布中表示页面/区块结构与行为的数据模型。其根节点（RootNode）涵盖样式、属性、状态、方法、生命周期、数据源与子节点树等信息。

本协议文档用于帮助模型准确理解字段语义与约束，指导正确调用 `edit_page_schema` 工具进行编辑。

## 字段

```typescript
export interface IFuncType {
  type: 'JSFunction'
  value: string
}

// 关键字段（简化展示，与 TinyEngine 运行时 RootNode 结构一致）：
export interface RootNode {
  id?: string
  componentName: string // 'Page' | 'Block' | 其他组件名
  fileName?: string
  css?: string
  props?: Record<string, any>
  state?: Record<string, any> // 顶层键-值映射
  lifeCycles?: Record<string, IFuncType> // { setup?: IFuncType, onMounted?: IFuncType, ... }
  methods?: Record<string, IFuncType>
  dataSource?: any
  children?: Array<Node>
  schema?: any
}
```

说明：
- `state` 为对象（map），键是状态名，值可以是字面量或特殊结构（如 `JSResource`、`JSExpression`、`computed`、`accessor`）。`edit_page_schema` 的 `merge` 策略对其执行“顶层键”级别的新增、更新与删除。
- `lifeCycles`、`methods` 的值必须是函数单元：`{ type: 'JSFunction', value: string }`。
- `css` 为整页样式字符串，`merge` 策略为“末尾追加”；`replace` 为整体覆盖。
- `children` 是可嵌套的节点树，涉及精细化增删改应使用“节点类工具”（如 `add_node`、`change_node_props` 等），而非本工具的 `schema` 合并。

## State

- 结构：`Record<string, any>`。
- 允许值：字面量、`JSExpression`、`JSResource`、`computed`、`accessor`（`getter`/`setter`）。
- `merge` 策略：
  - `add`：仅在键不存在时新增；
  - `update`：仅在键已存在时更新；
  - `remove`：删除指定顶层键；
  - 不会进行深层递归合并，聚焦于“顶层键”。

示例（节选）：

```json
{
  "section": "state",
  "strategy": "merge",
  "payload": {
    "add": {
      "companyName": "",
      "theme": {
        "type": "JSExpression",
        "value": "props.dark ? 'dark' : 'light'"
      }
    },
    "update": {
      "buttons": [{ "type": "primary", "text": "主要操作" }]
    },
    "remove": ["deprecatedKey"]
  }
}
```

## CSS

- `merge`：在原有 CSS 文本末尾追加新片段（必要时自动换行）。
- `replace`：整体覆盖。

示例：

```json
{
  "section": "css",
  "strategy": "merge",
  "payload": {
    "css": ".page-base-style{ padding:24px; }"
  }
}
```

## LifeCycles

- 结构：`Record<string, IFuncType>`，例如：`setup`、`onBeforeMount`、`onMounted` 等。
- 函数单元格式：`{ type: 'JSFunction', value: string }`。
- `merge`：
  - `add`：键不存在时新增；
  - `update`：键存在时替换；
  - `remove`：删除指定键；
- `replace`：以 `all` 重建或用 `add+update` 重建。

示例：

```json
{
  "section": "lifeCycles",
  "strategy": "merge",
  "payload": {
    "add": {
      "onMounted": {
        "type": "JSFunction",
        "value": "function onMounted(){ this.getTableData && this.getTableData() }"
      }
    }
  }
}
```

## Methods

- 结构：`Record<string, IFuncType>`，`IFuncType` 同上。
- `merge/replace` 行为与 `lifeCycles` 相同。

示例：

```json
{
  "section": "methods",
  "strategy": "merge",
  "payload": {
    "add": {
      "handleSearch": {
        "type": "JSFunction",
        "value": "function(e){ return ['搜索:', this.i18n('operation.search'), e] }"
      }
    }
  }
}
```

## Children

`children` 为节点树，元素形如：

```typescript
export interface Node {
  id: string
  componentName: string
  props: Record<string, any>
  children?: Node[]
  componentType?: 'Block' | 'PageStart' | 'PageSection'
  slot?: string | Record<string, any>
  loop?: Record<string, any>
  loopArgs?: string[]
  condition?: boolean | Record<string, any>
}
```

本工具不负责 `children` 的细粒度结构编辑。请优先使用节点类工具（如 `add_node`、`change_node_props`、`del_node` 等）。

## Schema 合并策略

当 `section = 'schema'` 且 `strategy = 'merge'` 时，仅支持对“顶层允许键”进行浅层更新：

允许键清单：`css`、`lifeCycles`、`methods`、`state`、`props`、`fileName`、`componentName`、`dataSource`、`children`。

注意：
- 未在允许清单内的键将被忽略；
- `children` 的细化变更请改用节点类工具；
- `strategy = 'replace'` 会整体替换页面 schema，具有破坏性，须谨慎。

## 常见陷阱

1. 将 `state` 写成数组。应为对象（map）。
2. `lifeCycles/methods` 未按 `JSFunction` 单元传入，或传入空字符串。
3. 误用 `schema.merge` 期望深层合并。实际上仅“顶层允许键”的浅合并。
4. 追加 CSS 时忘记换行导致样式黏连。
5. 使用 `replace` 且未提前读取现有结构，轻易覆盖重要字段。

## FAQ

Q：如何确认当前页面结构？
A：先调用 `get_page_schema` 工具查看再决定编辑策略。

Q：为什么我的 `lifeCycles.update` 不生效？
A：仅对已存在的键有效；若键不存在，请使用 `add` 或在 `replace` 模式下通过 `all` 重建。

Q：是否支持按组件粒度更新 `children`？
A：请改用节点类工具，如 `add_node`、`change_node_props`、`del_node` 等。
