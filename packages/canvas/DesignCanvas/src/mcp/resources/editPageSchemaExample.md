# 编辑页面 Schema 示例文档

## 概述
本文档提供 `edit_page_schema` 工具的完整使用示例。每个示例都包含场景描述、操作步骤和具体代码，帮助理解如何正确修改页面结构。

**重要原则**：
- 必须先阅读页面Schema协议了解数据结构
- 严格遵循本文档中的操作步骤
- 不同类型的修改有不同的标准流程

---

## State 示例

### 基础操作：添加、更新和删除状态

**场景**：管理页面的状态变量

```json
{
  "section": "state",
  "strategy": "merge",
  "state": {
    "add": {
      "companyName": "",
      "userCount": 0,
      "isLoading": false
    },
    "update": {
      "buttons": [
        { "type": "primary", "text": "主要操作" },
        { "type": "default", "text": "次要操作" }
      ]
    },
    "remove": ["deprecatedKey", "oldVariable"]
  }
}
```

**说明**：
- `add`：仅当键不存在时添加新状态变量
- `update`：仅当键已存在时更新其值
- `remove`：删除指定的状态变量（传入键名数组）

### 高级用法：计算属性和访问器

**场景**：创建具有自动计算能力的状态

```json
{
  "section": "state",
  "strategy": "merge",
  "state": {
    "add": {
      "fullName": {
        "defaultValue": "",
        "accessor": {
          "getter": {
            "type": "JSFunction",
            "value": "function getter(){ return `${this.props.firstName} ${this.props.lastName}` }"
          },
          "setter": {
            "type": "JSFunction",
            "value": "function setter(val){ const [firstName, lastName] = val.split(' '); this.emit('update:firstName', firstName); this.emit('update:lastName', lastName) }"
          }
        }
      },
      "totalPrice": {
        "type": "JSExpression",
        "value": "this.state.quantity * this.state.unitPrice",
        "computed": true
      }
    }
  }
}
```

### 完整场景：为组件绑定变量

**场景**：用户选中了一个组件，需要将其内容绑定到页面状态变量

**标准操作流程**：

#### 步骤1：在页面state中创建变量

```json
{
  "section": "state",
  "strategy": "merge",
  "state": {
    "add": {
      "testText": "defaultText",
      "dynamicTitle": "欢迎使用TinyEngine",
      "userGreeting": {
        "type": "JSExpression",
        "value": "`Hello, ${this.state.userName}!`",
        "computed": true
      }
    }
  }
}
```

#### 步骤2：将组件属性绑定到state变量

使用 `change_node_props` 工具（注意：这是另一个工具）：

```json
{
  "id": "text_component_id_123",
  "props": {
    "text": {
      "type": "JSExpression",
      "value": "this.state.testText"
    }
  }
}
```

**完整流程说明**：
1. 先通过 `get_current_selected_node` 获取选中组件的ID
2. 通过 `get_page_schema` 查看现有的state结构
3. 使用 `edit_page_schema` 在state中添加变量（如上步骤1）
4. 使用 `change_node_props` 将组件的text属性绑定到state变量（如上步骤2）
5. 现在组件会动态显示 `testText` 变量的值，修改变量时组件会自动更新

---

## CSS 示例

### 样式系统说明

TinyEngine支持三种样式方式：
1. **全局样式**：通过CSS字符串定义，影响整个页面
2. **Tailwind CSS**：直接使用Tailwind实用类，快速设置样式
3. **组件样式类**：自定义CSS类，通过className绑定到组件

### 重要原则：样式修改的最佳实践

**不推荐方式（仅在必要时使用）**：
```json
// ⚠️ 不推荐：直接修改组件的style属性（相当于行内样式）
{
  "id": "component_id",
  "props": {
    "style": "color: red; font-size: 16px;"
  }
}
// 注：行内样式难以维护和复用，仅在动态样式或特殊场景下使用
```

**推荐方式（优先使用）**：
```
步骤1：通过 edit_page_schema 添加CSS类
步骤2：通过 change_node_props 设置className
```

### 样式修改方式对比

| 方式 | 使用场景 | 优缺点 |
|------|---------|--------|
| **className + CSS类**（推荐） | 通用样式、可复用样式、主题样式 | ✅ 易维护、可复用、支持伪类<br>❌ 需要预定义 |
| **Tailwind CSS类** | 快速开发、响应式设计 | ✅ 快速便捷、原子化<br>❌ 类名较长 |
| **style属性**（行内样式） | 动态样式、一次性样式、JS计算样式 | ✅ 直接、动态<br>❌ 优先级高、难复用 |

**使用原则**：
1. 优先使用 className + CSS 类（可维护性最好）
2. 快速原型可用 Tailwind CSS
3. 仅在必要时使用 style 属性（如动态计算的样式值）

### 添加全局样式（merge策略）

**场景**：为页面添加新样式，保留现有样式

```json
{
  "section": "css",
  "strategy": "merge",
  "css": "\n/* 页面容器样式 */\n.page-container { padding: 24px; background: #f5f5f5; }\n\n/* 自定义组件样式 */\n.custom-title { font-size: 24px; color: #1890ff; margin-bottom: 16px; }\n.custom-card { border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }"
}
```

**注意事项**：
- merge策略在现有CSS末尾追加，记得添加换行符
- 添加清晰的注释说明样式用途
- 避免使用过于通用的选择器

### 修改公共样式（谨慎操作）

**场景**：修改component-base-style等影响所有组件的样式

```json
{
  "section": "css",
  "strategy": "merge",
  "css": "\n/* ⚠️ 警告：此样式影响所有组件 */\n.component-base-style { \n  font-family: 'PingFang SC', sans-serif;\n  line-height: 1.5;\n  /* 仅修改必要的基础属性 */\n}"
}
```

**重要警告**：
- `component-base-style`是所有组件的基础样式
- 修改会影响页面上的**所有组件**
- 建议仅修改字体、行高等基础属性
- 避免设置具体的尺寸、颜色等属性

### 使用Tailwind CSS类（推荐）

**场景**：快速为组件添加响应式、实用的样式

**限制说明**：当前仅支持在组件的 `className`/`class` 中直接书写 Tailwind 的原子类（utility classes），暂不支持在 `css` 字段中使用 Tailwind 的 functions 与 directives（如 `theme()`, `color()`, `@apply`, `@layer`, `@screen` 等）。

**将样式类直接绑定到组件**（使用 `change_node_props`）
```json
{
  "id": "component_id",
  "props": {
    "className": "bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow mb-4",
    "class": "px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
  }
}
```

**常用Tailwind类示例**：
- 布局：`flex`, `grid`, `container`, `mx-auto`
- 间距：`p-4`, `m-2`, `px-6`, `my-8`
- 颜色：`bg-gray-100`, `text-blue-600`, `border-red-500`
- 响应式：`sm:w-full`, `md:flex`, `lg:grid-cols-3`
- 状态：`hover:bg-gray-100`, `focus:ring-2`, `disabled:opacity-50`

### 完整示例：创建卡片组件样式（className 优先）

**场景**：为卡片组件创建完整的样式系统（通过 Tailwind utility 类）

**步骤：应用到组件结构**
```javascript
// 父容器
change_node_props({
  id: "card_container_id",
  props: {
    className: "bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 cursor-pointer"
  }
})

// 头部
change_node_props({
  id: "card_header_id",
  props: {
    className: "px-6 py-4 border-b border-gray-200"
  }
})

// 内容区
change_node_props({
  id: "card_body_id",
  props: {
    className: "p-6"
  }
})
```

### 替换全部样式（高风险操作）

**场景**：完全重建页面样式系统

```json
{
  "section": "css",
  "strategy": "replace",
  "css": "/* 新的样式系统（纯 CSS，不使用 Tailwind 指令） */\n.page-wrapper { min-height: 100vh; background-color: #f9fafb; }\n.content { max-width: 80rem; margin-left: auto; margin-right: auto; padding-left: 1rem; padding-right: 1rem; }"
}
```

**危险警告**：
- replace会**删除所有现有样式**
- 使用前必须先调用`get_page_schema`备份当前CSS
- 可能导致页面样式完全崩溃
- 建议仅在重构时使用

### CSS最佳实践

**推荐做法**：
1. **使用Tailwind优先**：利用内置的实用类快速开发
2. **语义化命名**：使用描述性的类名如`.user-card`而非`.card1`
3. **模块化组织**：相关样式放在一起，添加清晰注释
4. **渐进式修改**：使用merge策略逐步添加样式

**需要注意**：
1. **谨慎覆盖基础样式**：修改component-base-style影响全局
2. **记得绑定className**：添加新类后必须绑定到组件
3. **避免过度嵌套**：超过3层的CSS选择器嵌套影响性能
4. **优先使用设计系统**：Tailwind的颜色系统优于硬编码
5. **注意避免过度转义**: 不应该使用 `\\n`，应该使用 `\n` 换行。
6. **合理选择样式方式**：
   - 通用样式 → className + CSS
   - 动态样式 → style属性（如JS计算值）
   - 快速原型 → Tailwind CSS

### 样式绑定完整流程

```
1. 定义样式类（通过edit_page_schema添加CSS）
   ↓
2. 应用到组件（通过change_node_props设置className）
   ↓
3. 验证效果（检查组件是否正确应用样式）
```

**标准操作示例：为按钮添加自定义样式（className 直接写 utility 类）**

```json
{
  "id": "button_id",
  "props": {
    "className": "px-6 py-3 text-white rounded-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all"
  }
}
```

### 分批短文本追加（merge，多次）

**场景**：需要追加较多全局 CSS 时，避免一次提交过长的 `css` 字段导致 JSON 字符串未闭合。

**约定**：
1. 每次 `css` 保持在 2–4KB 以内。
2. 末尾添加换行符，便于在已有 CSS 后安全追加。
3. 将大段样式拆成多次 `strategy: "merge"` 的调用。

**示例（两段追加）：**
```json
{
  "section": "css",
  "strategy": "merge",
  "css": "\n/* part-1: layout */\n.page-container { padding: 24px; background: #f5f5f5; }\n"
}
```

```json
{
  "section": "css",
  "strategy": "merge",
  "css": "\n/* part-2: components */\n.custom-card { border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }\n.custom-title { font-size: 24px; color: #1890ff; margin-bottom: 16px; }\n"
}
```

### 调用稳健性建议

1. **优先使用 className 写 Tailwind utility 类**，无需在 `css` 字段写指令。
2. **仅在必要时使用短文本 CSS**；长样式请分批多次 `merge` 追加。
3. **为 `css` 追加结尾换行**，保证在已有样式后正确拼接。
4. **避免一次性长 JSON 字符串**，保持参数结构简短、扁平。

---

## Methods 示例

### 添加与替换方法

```json
{
  "section": "methods",
  "strategy": "replace",
  "methods": {
    "all": {
      "onClick": { "type": "JSFunction", "value": "function onClick(){ console.log('clicked') }" }
    }
  }
}
```

```json
{
  "section": "methods",
  "strategy": "merge",
  "methods": {
    "add": {
      "onSubmit": { "type": "JSFunction", "value": "function onSubmit(){ this.emit('submit') }" }
    },
    "update": {
      "onClick": { "type": "JSFunction", "value": "function onClick(){ alert('updated') }" }
    },
    "remove": ["legacyMethod"]
  }
}
```

---

## LifeCycles 示例

### 增删改生命周期

```json
{
  "section": "lifeCycles",
  "strategy": "merge",
  "lifeCycles": {
    "add": {
      "mounted": { "type": "JSFunction", "value": "function mounted(){ console.log('mounted') }" }
    },
    "update": {
      "mounted": { "type": "JSFunction", "value": "function mounted(){ console.log('mounted:updated') }" }
    },
    "remove": ["beforeUnmount"]
  }
}
```

---

## Schema 整体操作示例

### 顶层浅并（merge，仅允许部分顶层键）

```json
{
  "section": "schema",
  "strategy": "merge",
  "schema": {
    "props": { "title": "Dashboard" },
    "fileName": "DashboardPage"
  }
}
```

### 整量替换（replace，高风险）

```json
{
  "section": "schema",
  "strategy": "replace",
  "schema": {
    "css": "",
    "state": {},
    "methods": {},
    "lifeCycles": {},
    "props": {},
    "children": []
  }
}
```
