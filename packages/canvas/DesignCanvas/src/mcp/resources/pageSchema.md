## 概览

页面 schema 是 TinyEngine 在画布中表示页面/区块结构与行为的数据模型。其根节点（RootNode）涵盖样式、属性、状态、方法、生命周期、数据源与子节点树等信息。

## structure

TinyEngine 的页面 schema 结构如下：

```typescript
export interface IFuncType {
  type: 'JSFunction'
  value: string
}

// 关键字段：
export interface RootNode {
  id?: string
  componentName: string
  fileName?: string
  css?: string // 页面 css，等同于 vue 的 style 标签内容
  props?: Record<string, any>
  state?: Record<string, any>
  lifeCycles?: Record<string, IFuncType> // { setup?: IFuncType, onMounted?: IFuncType, ... }
  methods?: Record<string, IFuncType>
  dataSource?: any
  children?: Array<Node>
  schema?: any
}
```

说明：
- `componentName` 为合法值：`Page` | `Block`。当前 schema 类型。page 为页面，block 为区块。
- `fileName` 为文件名。TinyEngine 出码时，会根据 `fileName` 生成文件名。
- `css` 为页面 CSS，等同于 vue 单文件的 style 标签内容。
- `state` 为页面状态，等同于 vue 单文件中的 reactive 响应式对象。为对象（map），键是状态名。
- `lifeCycles`、`methods` 的值必须是函数单元：`{ type: 'JSFunction', value: string }`。
- `children` 为页面结构描述，等同于 vue 单文件的 template 标签内容。是可嵌套的节点树。

## State

- 结构：`Record<string, any>`。
- 允许值：字面量、`JSExpression`、`JSResource`、`computed`、`accessor`（`getter`/`setter`）。
- `merge` 策略：
  - `add`：仅在键不存在时新增；
  - `update`：仅在键已存在时更新；
  - `remove`：删除指定顶层键；
  - 不会进行深层递归合并，聚焦于“顶层键”。

### 示例

#### state 值示例

1. 常规值示例：

```json
{
  "state": {
    "firstName": "Opentiny",
    "age": 18,
    "food": ["apple", "orange", "banana"],
    "isLoading": false,
    "desc": {
      "description": "",
      "money": 100,
      "other": null,
      "rest": [{"type": "primary", "text": "主要操作"}]
    },
    "utilsExample": "this.utils.test()",
    "methodExample": {
      "type": "JSFunction",
      "value": "function methodExample(){ return 'methodExample' }"
    },
    "i18nExample": {
      "type": "i18n",
      "key": "lowcode.example"
    }
  }
}
```

vue 等效代码：

```javascript
const state = vue.reactive({
  firstName: "Opentiny",
  age: 18,
  food: ["apple", "orange", "banana"],
  isLoading: false,
  desc: {
    description: "",
    money: 100,
    other: null,
    rest: [{"type": "primary", "text": "主要操作"}]
  },
  utilsExample: utils.test(),
  methodExample: function methodExample(){ return 'methodExample' },
  i18nExample: t('lowcode.example')
})
```

2. getter/setter 示例：

```json
{
  "state": {
    "firstName": "",
    "lastName": "",
    "fullName": {
      "defaultValue": "",
      "accessor": {
        "getter": {
          "type": "JSFunction",
          "value": "function getter() { this.state.fullName = `${this.props.firstName} ${this.props.lastName}` }"
        },
        "setter": {
          "type": "JSFunction",
          "value": "function setter(val) { this.state.fullName = `${this.props.firstName} ${this.props.lastName}` }"
        }
      }
    }
  }
}
```

vue 等效代码：

```javascript
const state = vue.reactive({
  firstName: "",
  lastName: "",
  fullName: ""
})

vue.watchEffect(
  wrap(function getter() {
    this.state.fullName = `${this.props.firstName} ${this.props.lastName}`
  })
)

vue.watchEffect(
  wrap(function setter() {
    this.state.fullName = `${this.props.firstName} ${this.props.lastName}`
  })
)
```

## CSS

**说明**: 

- CSS 为页面 CSS，等同于 vue 单文件的 style 标签内容。
- merge 策略：
  - `merge`：在原有 CSS 文本末尾追加新片段（必要时自动换行）。
  - `replace`：整体覆盖。

### 示例

1. css schema 示例

```json
{
  "css": ".container { padding: 24px; margin: 20px; }\n.button-danger.button{ display: flex; justify-content: center; }"
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

### 示例

1. lifeCycles schema 示例：

```json
{
  "lifeCycles": {
    "setup": {
      "type": "JSFunction",
      "value": "function setup ({ props, state, watch, onMounted }) { console.log('lifecycle example') }"
    },
    "onMounted": {
      "type": "JSFunction",
      "value": "function onMounted(){ this.getTableData && this.getTableData() }"
    }
  }
}
```

## Methods

- 结构：`Record<string, IFuncType>`，`IFuncType` 同上。
- `merge/replace` 行为与 `lifeCycles` 相同。

### 示例

1. methods schema 示例

```json
{
  "methods": {
    "methodExample": {
      "type": "JSFunction",
      "value": "function methodExample() {\n  console.log('example')\n}\n"
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
  componentType?: 'Block'
  loop?: Record<string, any>
  loopArgs?: string[]
  condition?: boolean | Record<string, any>
}
```

### 示例

1. 常规值示例

```json
{
  "children": [
    {
      "componentName": "div",
      "props": {
        "className": "py-10 rounded-md"
      },
      "id": "2b2cabf0",
      "children": [
        {
          "componentName": "TinyTimeLine",
          "props": {
            "active": "2",
            "data": [
              {
                "name": "基础配置"
              },
              {
                "name": "网络配置"
              }
            ],
            "horizontal": true,
            "style": "border-radius: 0px;"
          },
          "id": "dd764b17"
        }
      ]
    }
  ]
}
```

2. 使用 condition 进行条件渲染示例（等同于 vue 中的 v-if ）

```json
{
  "children": [
    {
      "componentName": "div",
      "props": {
        "className": "py-10 rounded-md"
      },
      "id": "2b2cabf0",
      "children": [],
      "condition": {
        "type": "JSExpression",
        "value": "this.state.showContainer"
      }
    }
  ]
}
```

3. 使用 loop 与 loopArgs 进行循环渲染示例

```json
{
  "children": [
    {
      "componentName": "TinyButton",
      "props": {
        "text": {
          "type": "JSExpression",
          "value": "item.text"
        },
        "className": "component-base-style",
        "key": {
          "type": "JSExpression",
          "value": "index"
        },
        "type": {
          "type": "JSExpression",
          "value": "item.type"
        }
      },
      "children": [],
      "id": "22455446",
      "loop": {
        "type": "JSExpression",
        "value": "this.state.loopExample"
      },
      "loopArgs": [
        "item",
        "index"
      ]
    }
  ]
}
```
