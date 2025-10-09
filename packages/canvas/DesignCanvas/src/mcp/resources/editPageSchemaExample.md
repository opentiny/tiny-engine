# 编辑页面 Schema 示例文档

## 概述
本文档提供 `edit_page_schema` 工具的完整使用示例。每个示例都包含场景描述、操作步骤和具体代码，帮助理解如何正确修改页面结构。

**重要原则**：
- 必须先阅读页面Schema协议了解数据结构
- 严格遵循本文档中的操作步骤
- 不同类型的修改有不同的标准流程

---

## State

### 示例1: 基础操作：添加、更新和删除状态

**场景**：管理页面的状态变量

```json
{
  "section": "state",
  "strategy": "merge",
  "state": {
    "add": {
      "companyName": "",
      "userCount": 0,
      "isLoading": false,
      "theme": {
        "type": "JSExpression",
        "value": "props.dark ? 'dark' : 'light'"
      }
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

### 示例2: 使用 replace 策略完整替换 state：

```json
{
  "section": "state",
  "strategy": "replace",
  "state": {
    "all": {
      "isLoading": false,
      "currentPage": 1,
      "tableData": [],
      "searchKeyword": "",
      "theme": {
        "type": "JSExpression",
        "value": "this.props.theme || 'light'"
      }
    }
  }
}
```

### 示例3: 高级用法：计算属性和访问器

**场景**：创建具有自动计算能力的状态

```json
{
  "section": "state",
  "strategy": "merge",
  "state": {
    "add": {
      "firstName": "",
      "lastName": "",
      "fullName": {
        "defaultValue": "",
        "accessor": {
          "getter": {
            "type": "JSFunction",
            "value": "function getter(){ this.state.fullName = `${this.state.firstName} ${this.state.lastName}` }"
          },
          "setter": {
            "type": "JSFunction",
            "value": "function setter(val){ const [firstName, lastName] = val.split(' '); this.emit('update:firstName', firstName); this.emit('update:lastName', lastName) }"
          }
        }
      },
      "totalPrice": {
        "type": "JSExpression",
        "value": "this.props.quantity * this.props.unitPrice",
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

## CSS

### 示例1: 添加全局样式

适用场景：追加样式。不修改原来的样式。
合并策略：在末尾追加。

```json
{
  "section": "css",
  "strategy": "merge",
  "css": "\n/* 页面容器样式 */\n.page-container { padding: 24px; background: #f5f5f5; }\n\n/* 自定义组件样式 */\n.custom-title { font-size: 24px; color: #1890ff; margin-bottom: 16px; }\n.custom-card { border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }"
}
```

### 示例2: 修改、替换样式

适用场景：修改、替换样式。
合并策略：替换 schema 中的 css 字段为传入的新值。

```json
{
  "section": "css",
  "strategy": "replace",
  "css": "\n/* 页面容器样式 */\n.page-container { padding: 24px; background: #f2f2f2; }\n\n/* 自定义组件样式 */\n.custom-title { font-size: 18px; color: #1890ff; margin-bottom: 12px; }\n.custom-card { border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }"
}
```

### 示例3: 使用 change_node_props 工具 修改 props 的 style 属性修改样式。

使用场景：相当于行内样式，优先级高于 css 样式，建议仅在特殊场景使用。（⚠️ 不推荐所有样式都通过 style 属性修改，应该尽量使用 className 和 css 样式）

```json
{
  "id": "component_id",
  "props": {
    "style": "color: red; font-size: 16px;"
  }
}
```

### 完整示例1: 直接绑定 tailwind 样式到 className 属性。（推荐）

> TinyEngine 支持 tailwind，可以快捷添加 tailwind 使用的原子类名到 className 属性上，实现样式的快速修改。

```json

{
  "id": "card_container_id",
  "props": {
    "className": "bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 cursor-pointer"
  }
}
```

### 完整示例2：创建卡片组件样式

1. 通过 `edit_page_schema` 工具 添加 css 样式。

```json
{
  "section": "css",
  "strategy": "merge",
  "css": "\n/* 卡片组件样式 */\n.card { \n  border: 1px solid #e0e0e0; \n  border-radius: 8px; \n  padding: 16px; \n  box-shadow: 0 4px 8px rgba(0,0,0,0.1); \n}\n\n/* 头部样式 */\n.card-header { \n  font-size: 18px; \n  color: #333; \n  margin-bottom: 12px; \n}\n\n/* 内容区样式 */\n.card-body { \n  font-size: 14px; \n  color: #666; \n}\n"
}
```

2. 通过 `change_node_props` 工具 设置 className。

```json
{
  "id": "card_container_id",
  "props": {
    "className": "card"
  }
}
```

### CSS最佳实践

**推荐做法**：
1. **使用Tailwind优先**：利用Tailwind内置的实用类快速开发
2. **语义化命名**：使用描述性的类名如`.user-card`而非`.card1`
3. **模块化组织**：相关样式放在一起，添加清晰注释
4. **渐进式修改**：使用merge策略逐步添加样式

**需要注意**：
1. **谨慎覆盖基础样式**：修改component-base-style影响全局
2. **记得绑定className**：添加新类后必须绑定到组件
3. **合理选择样式方式**：
   - 通用样式 → className + CSS
   - 动态样式 → style属性（如JS计算值）
   - 快速原型 → Tailwind CSS

---

## Methods

### 示例1: 替换方法

适用场景：将原有的 methods 中的所有方法删除，然后替换为新的方法。
合并策略：替换 schema 中的 methods 字段为传入的新值。

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

### 示例2: 添加、更新、移除方法

适用场景：添加、更新、移除方法。
合并策略：添加、更新、移除方法。

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

## LifeCycles

### 示例1: 添加、更新、移除生命周期

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

### 示例2: 替换生命周期

适用场景：替换生命周期。
合并策略：替换 schema 中的 lifeCycles 字段为传入的新值。

```json
{
  "section": "lifeCycles",
  "strategy": "replace",
  "lifeCycles": {
    "all": { "mounted": { "type": "JSFunction", "value": "function mounted(){ console.log('mounted') }" } }
  }
}
```

---

## Schema

### 示例1: 编辑完整的 schema

适用场景：
- 编辑 schema 中的 children 字段，并且涉及大量修改。（少量节点的精准修改，推荐使用 `change_node_props`、`add_node`、`delete_node` 等工具）
- 编辑 schema 中的其他字段，并且涉及大量修改。比如大量修改 state、methods、lifeCycles 等字段。

```json
{
  "section": "schema",
  "strategy": "merge",
  "schema": {
    "props": { "title": "Dashboard" },
    "css": "\n/* 页面容器样式 */\n.page-container { padding: 24px; background: #f2f2f2; }\n\n/* 自定义组件样式 */\n.custom-title { font-size: 18px; color: #1890ff; margin-bottom: 12px; }\n.custom-card { border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }",
    "state": {
      "userCount": 0,
      "isLoading": false,
    },
    "methods": {
      "onClick": { "type": "JSFunction", "value": "function onClick(){ console.log('clicked') }" }
    },
    "lifeCycles": {
      "mounted": { "type": "JSFunction", "value": "function mounted(){ console.log('mounted') }" }
    },
    "children": [
      {
        "id": "card_container_id",
        "componentName": "Card",
        "props": {
          "title": "Card Title"
        }
      }
    ]
  }
}
```
