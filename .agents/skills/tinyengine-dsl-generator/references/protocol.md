# TinyEngine DSL Protocol Reference

本文档包含 TinyEngine 低代码平台 DSL 协议的完整参考，用于生成符合协议规范的 JSON 数据。

## 目录

1. [应用协议](#应用协议)
2. [页面结构](#页面结构)
3. [组件结构](#组件结构)
4. [区块结构](#区块结构)
5. [保留字](#保留字)
6. [插槽语法](#插槽语法)
7. [数据源](#数据源)
8. [国际化](#国际化)

---

## 应用协议

### 应用结构

```typescript
interface IAppSchema {
  version: string // 协议版本号，如 "1.0.0"
  componentsMap: IComponentMap[] // 组件映射关系
  componentsTree: IPageSchema[] // 应用包含的页面列表
  bridge: IBridge[] // 桥接源（工具函数、依赖）
  meta: IAppMeta // 应用基础信息
  dataSource?: IDataSource // 应用级数据源
  i18n?: II18n // 应用级国际化
  utils?: any[] // 工具类
  constants?: Record<string, any> // 常量
  css?: string // 全局CSS
  config?: IAppConfig // 应用配置
}

interface IComponentMap {
  componentName: string // 渲染时使用的组件名
  package: string // npm包名
  version: string // 版本号
  destructuring: boolean // 是否解构
  exportName: string // 导出名
  subName?: string // 子导出名
}

interface IAppMeta {
  appId: string | number // App Schema 中建议使用整数 (e.g., 918)；服务端持久化时会转成字符串
  name: string
  description: string
  creator: string
  git_group?: string
  project_name?: string
  gmt_create: string
  gmt_modified: string
}

/**
 * App ID 格式建议:
 * - App Schema 文件中的 `id` 字段: 整数类型 (e.g., 918)
 * - App Schema 文件中的 `meta.appId` 字段: 整数类型 (e.g., 918)
 * - App Metadata 文件中的 `id` 字段: 整数类型 (e.g., 918)
 * - Page 文件中的 `app` 字段: 字符串类型 (e.g., "918")
 *
 * 注意: pages.js 使用 appId.toString() 查询页面，直接落盘的 Page 文件必须用字符串 app 引用。
 */

interface IAppConfig {
  sdkVersion: string
  historyMode: 'hash' | 'browser'
  targetRootID: string
}

interface IBridge {
  name: string
  type: 'npm' | 'function'
  content?: {
    package?: string
    version?: string
    exportName?: string
    subName?: string
    destructuring?: boolean
    main?: string
  }
}
```

---

## 页面结构

### 页面 Schema

```typescript
interface IPageSchema {
  componentName: 'Page' // 固定值
  fileName: string // 页面文件名
  meta: IPageMeta // 页面元信息
  props?: IProps // 页面属性
  state?: Record<string, any> // 页面状态
  methods?: Record<string, IJSFunction> // 页面方法
  lifeCycles?: Record<string, IJSFunction> // 生命周期
  children?: IComponentSchema[] | string // 子组件
  css?: string // 页面CSS (换行必须转义为 \n)
  dataSource?: IDataSource // 页面数据源
  utils?: any[] // 页面工具函数
  bridge?: IBridge[] // 页面桥接源
  occupier?: null | IOccupier // ⚠️ 必须为 null 才能编辑页面
}

interface IPageMeta {
  id: number
  title: string
  description?: string
  router: string // 不能以 / 开头，不支持路由参数 xxx/:id
  creator: string
  isHome: boolean
  parentId: string // 顶层时为 "0"
  rootElement: string // 如 "div"
  group: string // 如 "staticPages"
  gmt_create: string
  gmt_modified: string
}

interface IOccupier {
  id: number
  username: string
  email: string
  is_admin: boolean
}
```

### 页面示例

```json
{
  "componentName": "Page",
  "fileName": "HomePage",
  "meta": {
    "id": 1,
    "title": "首页",
    "router": "home",
    "creator": "admin",
    "isHome": true,
    "parentId": "0",
    "rootElement": "div",
    "group": "staticPages",
    "description": "应用首页",
    "gmt_create": "2024-01-01 00:00:00",
    "gmt_modified": "2024-01-01 00:00:00"
  },
  "props": {},
  "state": {
    "count": 0,
    "message": "Hello"
  },
  "methods": {
    "handleClick": {
      "type": "JSFunction",
      "value": "function(event) { this.state.count++ }"
    }
  },
  "lifeCycles": {
    "onMounted": {
      "type": "JSFunction",
      "value": "function onMounted() { console.log('Page mounted'); }"
    }
  },
  "css": ".container { padding: 20px; }",
  "occupier": null,
  "children": []
}
```

### 生命周期钩子

可用的生命周期名称（必须以 `on` 开头）：

| 生命周期          | 说明                | Vue 等价          |
| ----------------- | ------------------- | ----------------- |
| `setup`           | 组合式 API 设置入口 | setup()           |
| `onBeforeMount`   | 挂载前              | onBeforeMount()   |
| `onMounted`       | 挂载后              | onMounted()       |
| `onBeforeUpdate`  | 更新前              | onBeforeUpdate()  |
| `onUpdated`       | 更新后              | onUpdated()       |
| `onBeforeUnmount` | 卸载前              | onBeforeUnmount() |
| `onUnmounted`     | 卸载后              | onUnmounted()     |

**setup 生命周期特殊参数**:

```json
{
  "lifeCycles": {
    "setup": {
      "type": "JSFunction",
      "value": "function setup({ props, state, watch, onMounted, onUpdated }) {\n  // 使用这些参数进行响应式编程\n  watch(() => props.data, (newVal) => { console.log('Data changed:', newVal); });\n}"
    }
  }
}
```

---

## 组件结构

### 组件 Schema

```typescript
interface IComponentSchema {
  componentName: string // 组件名或区块名
  componentType?: 'block' // 为区块时设置此值
  id: string // 唯一ID
  props?: IProps // 组件属性
  children?: IComponentSchema[] | string // 子组件
  condition?: ICondition // 条件渲染
}

interface IProps {
  [key: string]: IPropValue | any
}

type IPropValue = string | number | boolean | Array<any> | Object | IJSExpression | II18n | IJSFunction | IJSResource

interface IJSExpression {
  type: 'JSExpression'
  value: string // 如 "this.state.count"
  model?: boolean | { prop: string } // 双向绑定: true 表示 v-model，{prop:"xxx"} 表示 v-model:xxx
  params?: string[] // 事件附加参数 (追加在 event 之后)
}

// ⚠️ 事件绑定规则 (CRITICAL - 常见错误区域):
// 1. 事件绑定必须使用 JSExpression，不能用 JSFunction
// 2. 引用 methods 中定义的方法
// 3. 第一个参数自动是 event，params 中的参数追加在后面
// 4. ❌ 禁止：JSExpression 的 value 中包含 function 定义
// 示例:
//   ✅ 正确 - 绑定: "onClick": { "type": "JSExpression", "value": "this.handleClick", "params": ["'id'"] }
//   ❌ 错误 - 绑定: "onClick": { "type": "JSExpression", "value": "function(event) { ... }" }
//   调用: handleClick(event, 'id')
//   方法定义: "handleClick": { "type": "JSFunction", "value": "function(event, id) { ... }" }
//
// 记忆口诀:
// - JSExpression = 引用 (this.methodName)
// - JSFunction = 定义 (function() {...})
// - 事件绑定用引用 (JSExpression)，方法定义用函数 (JSFunction)

// ⚠️ 双向绑定规则:
// 1. 标准双向绑定使用 model: true
//    "modelValue": { "type": "JSExpression", "value": "this.state.text", "model": true }
//    等价于 Vue: v-model="state.text"
// 2. 具名双向绑定使用 model: { "prop": "xxx" }
//    "visible": { "type": "JSExpression", "value": "this.state.visible", "model": { "prop": "visible" } }
//    等价于 Vue: v-model:visible="state.visible"

interface II18n {
  type: 'i18n'
  key: string // 国际化key
}

interface IJSFunction {
  type: 'JSFunction'
  value: string // 函数字符串
}

interface IJSResource {
  type: 'JSResource'
  value: string // 如 "this.utils.formatDate()"
}

interface ICondition {
  type: 'JSExpression'
  value: string // 条件表达式
}
```

### 属性类型说明

| 类型           | 说明       | 示例                                                     |
| -------------- | ---------- | -------------------------------------------------------- |
| 字面值         | 直接值     | `"text"`, `123`, `true`                                  |
| `JSExpression` | 表达式绑定 | `{"type": "JSExpression", "value": "this.state.count"}`  |
| `i18n`         | 国际化     | `{"type": "i18n", "key": "app.title"}`                   |
| `JSFunction`   | 函数       | `{"type": "JSFunction", "value": "function() {}"}`       |
| `JSResource`   | 资源引用   | `{"type": "JSResource", "value": "this.utils.format()"}` |

### ⚠️ 常见错误：事件绑定中的类型混淆

**错误示例** (在事件绑定中使用 `JSExpression` 但 `value` 中包含函数定义):

```json
// ❌ 错误
{
  "componentName": "TinyButton",
  "props": {
    "onClick": {
      "type": "JSExpression",
      "value": "function(event) { this.doSomething(); }"
    }
  }
}
```

**正确做法** (将函数定义放在 `methods` 中，事件绑定引用方法):

```json
// ✅ 正确
{
  "methods": {
    "handleClick": {
      "type": "JSFunction",
      "value": "function(event) { this.doSomething(); }"
    }
  },
  "children": [
    {
      "componentName": "TinyButton",
      "props": {
        "onClick": {
          "type": "JSExpression",
          "value": "this.handleClick"
        }
      }
    }
  ]
}
```

**关键规则**:

- `JSExpression.value` = 方法引用 (如 `this.methodName`)
- `JSFunction.value` = 函数定义 (如 `function() {...}`)
- 事件绑定用 `JSExpression`，函数定义用 `JSFunction`

---

## 区块结构

### 区块 Schema

```typescript
interface IBlockSchema {
  componentName: 'Block' // 固定值
  fileName: string // 区块文件名
  label: string // 区块HTML标签
  css?: string // 区块CSS
  props?: IProps // 区块属性（可配置）
  state?: Record<string, any> // 区块状态
  methods?: Record<string, IJSFunction> // 区块方法
  lifeCycles?: Record<string, IJSFunction> // 生命周期
  schema: IBlockSchemaConfig // 区块对外暴露的配置schema
  children?: IComponentSchema[] // 区块内容
  dataSource?: IDataSource // 区块数据源
}

interface IBlockSchemaConfig {
  properties: IPropertyConfig[] // 可配置属性
  events?: Record<string, IEventConfig> // 可触发事件
  slots?: Record<string, any> // 插槽定义
}

interface IPropertyConfig {
  label: { zh_CN: string }
  description?: { zh_CN: string }
  content: IPropertyItem[]
}

interface IPropertyItem {
  property: string // 属性名
  type: string | string[] // 属性类型
  defaultValue: any // 默认值
  label: { text: { zh_CN: string } }
  widget: {
    // 配置组件
    component: string
    props?: any
  }
  required?: boolean
  cols?: number
}
```

### 区块使用示例

在页面中引用区块：

```json
{
  "componentName": "MyBlock", // 区块的fileName
  "componentType": "block",
  "id": "block-001",
  "props": {
    "title": "标题", // 传递给区块的props
    "data": {
      "type": "JSExpression",
      "value": "this.state.list"
    }
  }
}
```

---

## 保留字

以下`componentName`为保留关键字，不允许使用同名物料：

| ComponentName | 说明                 | 用途                                  |
| ------------- | -------------------- | ------------------------------------- |
| `Page`        | 页面容器             | 配合`fileName`确定页面名称            |
| `Block`       | 区块容器             | 配合`fileName`确定区块名称            |
| `Component`   | 业务组件容器（预留） | -                                     |
| `Template`    | 虚拟容器，不渲染     | 用于具名插槽，children 为[]时出码跳过 |
| `Slot`        | 插槽定义             | 定义具名插槽                          |
| `Collection`  | 数据源容器，不渲染   | 提供数据源，出码跳过                  |
| `Text`        | 文本节点             | 使用 span 渲染，text 属性包含内容     |

---

## 插槽语法

### 定义插槽

```json
{
  "componentName": "slot",
  "props": {
    "name": "formSlot"
  },
  "children": [
    {
      "componentName": "tiny-input",
      "props": {}
    }
  ]
}
```

生成代码：`<slot><tiny-input></tiny-input></slot>`

### 使用作用域插槽

```json
{
  "componentName": "template",
  "props": {
    "slot": {
      "name": "footer",
      "params": ["row"]
    }
  },
  "children": [...]
}
```

生成代码：`<template #footer="{ row }">...</template>`

### 表格插槽示例

```json
{
  "slots": {
    "header": {
      "type": "JSSlot",
      "params": ["column"],
      "value": [
        {
          "componentName": "div",
          "children": [...]
        }
      ]
    }
  }
}
```

---

## 数据源

### 数据源结构

```typescript
interface IDataSource {
  dataHandler?: string
  list: IDataSourceItem[]
}

interface IDataSourceItem {
  id: string | number
  name: string
  desc?: string
  app: string
  type: 'fetch' | 'value'
  data?: {
    columns?: Array<any>
    data?: Array<any>
    dataHandler?: IJSFunction
    errorHandler?: IJSFunction
    option?: {
      method: string
      url: string
    }
    shouldFetch?: IJSFunction
    willFetch?: IJSFunction
  }
  value?: {
    data?: Array<any>
    columns?: Array<any>
  }
}
```

### Collection 容器使用数据源

```json
{
  "componentName": "collection",
  "props": {
    "dataSource": "tableData"
  },
  "children": [
    {
      "componentName": "tiny-grid",
      "props": {
        "data": {
          "type": "JSExpression",
          "value": "this.tableData"
        },
        "columns": [...]
      }
    }
  ]
}
```

---

## 国际化

### i18n 结构

```typescript
interface II18n {
  [locale: string]: {
    [key: string]: string // key-value对，支持模板如 "Hello ${name}"
  }
}
```

### i18n 示例

```json
{
  "i18n": {
    "zh-CN": {
      "app-title": "我的应用",
      "welcome": "你好 ${name}"
    },
    "en-US": {
      "app-title": "My App",
      "welcome": "Hello ${name}"
    }
  }
}
```

### 使用 i18n

在 props 中：

```json
{
  "props": {
    "text": {
      "type": "i18n",
      "key": "app-title"
    }
  }
}
```

带参数：

```json
{
  "props": {
    "text": {
      "type": "i18n",
      "key": "welcome",
      "params": {
        "name": "World"
      }
    }
  }
}
```
