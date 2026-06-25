# TinyEngine DSL Common Patterns

本文档包含生成 TinyEngine DSL 时的常见模式和模板。

## 目录

1. [常用页面模板](#常用页面模板)
2. [常见交互模式](#常见交互模式)
3. [布局模式](#布局模式)
4. [数据流模式](#数据流模式)
5. [区块设计模式](#区块设计模式)

---

## 常用页面模板

### 列表页模板

```json
{
  "componentName": "Page",
  "fileName": "ListPage",
  "meta": {
    "id": 1,
    "title": "列表页",
    "router": "list",
    "creator": "admin",
    "isHome": false,
    "parentId": "0",
    "rootElement": "div",
    "group": "staticPages",
    "description": "通用列表页",
    "gmt_create": "2024-01-01 00:00:00",
    "gmt_modified": "2024-01-01 00:00:00"
  },
  "state": {
    "tableData": [],
    "loading": false,
    "pagination": {
      "currentPage": 1,
      "pageSize": 10,
      "total": 0
    },
    "searchForm": {}
  },
  "methods": {
    "fetchData": {
      "type": "JSFunction",
      "value": "function() { this.state.loading = true; /* fetch data */ }"
    },
    "handleSearch": {
      "type": "JSFunction",
      "value": "function() { this.state.pagination.currentPage = 1; this.fetchData(); }"
    },
    "handleReset": {
      "type": "JSFunction",
      "value": "function() { this.state.searchForm = {}; this.fetchData(); }"
    }
  },
  "children": [
    {
      "componentName": "div",
      "props": {
        "className": "page-header"
      },
      "children": [
        {
          "componentName": "TinyButton",
          "props": {
            "type": "primary",
            "text": "新增",
            "onClick": {
              "type": "JSExpression",
              "value": "this.handleAdd"
            }
          },
          "id": "btn-add"
        }
      ],
      "id": "header-001"
    },
    {
      "componentName": "TinyForm",
      "props": {
        "model": {
          "type": "JSExpression",
          "value": "this.state.searchForm"
        },
        "labelWidth": "80px"
      },
      "children": [
        {
          "componentName": "TinyFormItem",
          "props": {
            "label": "名称"
          },
          "children": [
            {
              "componentName": "TinyInput",
              "props": {
                "modelValue": {
                  "type": "JSExpression",
                  "value": "this.state.searchForm.name",
                  "model": {
                    "prop": "name"
                  }
                },
                "placeholder": "请输入名称"
              },
              "id": "input-name"
            }
          ],
          "id": "form-item-name"
        }
      ],
      "id": "search-form"
    },
    {
      "componentName": "TinyGrid",
      "props": {
        "data": {
          "type": "JSExpression",
          "value": "this.state.tableData"
        },
        "columns": [
          {
            "field": "id",
            "title": "ID",
            "width": 80
          },
          {
            "field": "name",
            "title": "名称"
          },
          {
            "field": "actions",
            "title": "操作",
            "fixed": "right",
            "width": 200
          }
        ],
        "border": true
      },
      "id": "data-grid"
    },
    {
      "componentName": "TinyPager",
      "props": {
        "currentPage": {
          "type": "JSExpression",
          "value": "this.state.pagination.currentPage"
        },
        "pageSize": {
          "type": "JSExpression",
          "value": "this.state.pagination.pageSize"
        },
        "total": {
          "type": "JSExpression",
          "value": "this.state.pagination.total"
        },
        "layout": "total, sizes, prev, pager, next, jumper",
        "onCurrentChange": {
          "type": "JSExpression",
          "value": "this.handlePageChange"
        }
      },
      "id": "pagination"
    }
  ]
}
```

### 表单页模板

```json
{
  "componentName": "Page",
  "fileName": "FormPage",
  "meta": {
    "id": 2,
    "title": "表单页",
    "router": "form",
    "creator": "admin",
    "isHome": false,
    "parentId": "0",
    "rootElement": "div",
    "group": "staticPages",
    "gmt_create": "2024-01-01 00:00:00",
    "gmt_modified": "2024-01-01 00:00:00"
  },
  "state": {
    "formData": {},
    "rules": {
      "name": [{ "required": true, "message": "请输入名称" }],
      "email": [{ "type": "email", "message": "请输入正确的邮箱" }]
    }
  },
  "methods": {
    "handleSubmit": {
      "type": "JSFunction",
      "value": "async function() { const valid = await this.$refs.formRef.validate(); if (valid) { /* submit */ } }"
    },
    "handleCancel": {
      "type": "JSFunction",
      "value": "function() { this.$router.back(); }"
    }
  },
  "children": [
    {
      "componentName": "TinyForm",
      "props": {
        "ref": "formRef",
        "model": {
          "type": "JSExpression",
          "value": "this.state.formData"
        },
        "rules": {
          "type": "JSExpression",
          "value": "this.state.rules"
        },
        "labelWidth": "100px"
      },
      "children": [
        {
          "componentName": "TinyFormItem",
          "props": {
            "label": "名称",
            "prop": "name",
            "required": true
          },
          "children": [
            {
              "componentName": "TinyInput",
              "props": {
                "modelValue": {
                  "type": "JSExpression",
                  "value": "this.state.formData.name",
                  "model": { "prop": "name" }
                }
              },
              "id": "form-name"
            }
          ],
          "id": "item-name"
        }
      ],
      "id": "main-form"
    },
    {
      "componentName": "div",
      "props": {
        "className": "form-actions"
      },
      "children": [
        {
          "componentName": "TinyButton",
          "props": {
            "type": "primary",
            "text": "提交",
            "onClick": {
              "type": "JSExpression",
              "value": "this.handleSubmit"
            }
          },
          "id": "btn-submit"
        },
        {
          "componentName": "TinyButton",
          "props": {
            "text": "取消",
            "onClick": {
              "type": "JSExpression",
              "value": "this.handleCancel"
            }
          },
          "id": "btn-cancel"
        }
      ],
      "id": "actions"
    }
  ]
}
```

---

## 常见交互模式

> **事件绑定规则**: 事件必须用 `JSExpression` 引用 `methods` 中的方法，不能用 `JSFunction`，`value` 里也不准写函数体。完整 ❌/✅ 见 [SKILL.md](../SKILL.md)「Critical Rules」与 [protocol.md](protocol.md)。下面只给模板。

### 事件参数传递

方法第一个参数总是 `event`，`params` 中的参数会追加到 event 后面。

```json
// 方法定义 - 第一个参数是 event
"methods": {
  "deleteItem": {
    "type": "JSFunction",
    "value": "function(event, itemId) { /* event 和 itemId 都可用 */ }"
  }
}

// 绑定 - params 中的参数追加在 event 后
"onClick": {
  "type": "JSExpression",
  "value": "this.deleteItem",
  "params": ["123"]  // 实际调用: deleteItem(event, 123)
}
```

### 传递行数据到事件

```json
// 表格列操作 - 传递当前行
"methods": {
  "handleEdit": {
    "type": "JSFunction",
    "value": "function(event, row) { this.state.editingRow = row; }"
  }
}

// 列定义中使用 slot
{
  "field": "actions",
  "title": "操作",
  "slots": {
    "default": {
      "type": "JSSlot",
      "params": ["row"],
      "value": [
        {
          "componentName": "TinyButton",
          "props": {
            "text": "编辑",
            "size": "small",
            "onClick": {
              "type": "JSExpression",
              "value": "this.handleEdit",
              "params": ["row"]  // handleEdit(event, row)
            }
          },
          "id": "btn-edit-row"
        }
      ]
    }
  }
}
```

### 确认删除操作

```json
"methods": {
  "handleDelete": {
    "type": "JSFunction",
    "value": "function(event, row) { this.$modal.confirm({ message: '确定要删除吗?' }).then(() => { this.deleteItem(row.id); }); }"
  },
  "deleteItem": {
    "type": "JSFunction",
    "value": "async function(id) { /* 执行删除 */ }"
  }
}

// 绑定
"onClick": {
  "type": "JSExpression",
  "value": "this.handleDelete",
  "params": ["row"]
}
```

### 弹窗表单

```json
{
  "componentName": "TinyDialogBox",
  "props": {
    "visible": {
      "type": "JSExpression",
      "value": "this.state.dialogVisible"
    },
    "title": "编辑",
    "width": "600px"
  },
  "children": [
    {
      "componentName": "TinyForm",
      "props": {
        "model": {
          "type": "JSExpression",
          "value": "this.state.dialogForm"
        }
      },
      "children": [...],
      "id": "dialog-form"
    }
  ],
  "id": "edit-dialog"
}
```

### 搜索重置

```json
{
  "componentName": "div",
  "props": {
    "className": "search-actions"
  },
  "children": [
    {
      "componentName": "TinyButton",
      "props": {
        "type": "primary",
        "text": "查询",
        "onClick": {
          "type": "JSExpression",
          "value": "this.handleSearch"
        }
      },
      "id": "btn-search"
    },
    {
      "componentName": "TinyButton",
      "props": {
        "text": "重置",
        "onClick": {
          "type": "JSExpression",
          "value": "this.handleReset"
        }
      },
      "id": "btn-reset"
    }
  ],
  "id": "search-actions"
}
```

---

## 布局模式

### 页面级 CSS 样式

页面可以使用 `css` 字段定义全局样式类。建议使用单行格式以保持 JSON 简洁：

**推荐 (单行格式)**:

```json
{
  "componentName": "Page",
  "fileName": "MyPage",
  "css": ".page-base-style { padding: 24px; background: #FFFFFF; } .block-base-style { margin: 16px; } .component-base-style { margin: 8px; }",
  "props": {
    "className": "page-base-style"
  },
  "children": [
    {
      "componentName": "div",
      "props": {
        "className": "block-base-style"
      },
      "children": [...]
    }
  ]
}
```

**备选 (多行格式)** - 用于复杂样式:

```json
{
  "componentName": "Page",
  "fileName": "MyPage",
  "css": ".page-base-style {\n  padding: 24px;\n  background: #FFFFFF;\n}\n\n.block-base-style {\n  margin: 16px;\n}\n\n.component-base-style {\n  margin: 8px;\n}\n",
  "props": {
    "className": "page-base-style"
  }
}
```

**注意**: 对于简单样式，使用单行格式。对于复杂样式，使用多行格式并将换行表示为 `\n`。

### 内联样式

```json
{
  "componentName": "div",
  "props": {
    "style": "display: flex; align-items: center; justify-content: space-between; padding: 16px; background: #f5f5f5;"
  },
  "children": [...],
  "id": "styled-container"
}
```

### Tailwind CSS 类名

支持使用 Tailwind CSS 工具类：

```json
{
  "componentName": "div",
  "props": {
    "className": "flex items-center justify-between p-4 bg-gray-100 rounded-lg shadow-md"
  },
  "children": [...],
  "id": "tailwind-container"
}
```

### 左右布局

```json
{
  "componentName": "div",
  "props": {
    "className": "layout-container",
    "style": "display: flex; height: 100vh;"
  },
  "children": [
    {
      "componentName": "div",
      "props": {
        "className": "layout-sidebar",
        "style": "width: 240px; border-right: 1px solid #ddd;"
      },
      "children": [...],
      "id": "sidebar"
    },
    {
      "componentName": "div",
      "props": {
        "className": "layout-main",
        "style": "flex: 1; padding: 20px;"
      },
      "children": [...],
      "id": "main"
    }
  ],
  "id": "layout-container"
}
```

### 上下布局 (Header + Content)

```json
{
  "componentName": "div",
  "props": {
    "className": "page-layout",
    "style": "display: flex; flex-direction: column; height: 100vh;"
  },
  "children": [
    {
      "componentName": "div",
      "props": {
        "className": "page-header",
        "style": "height: 60px; border-bottom: 1px solid #eee; padding: 0 20px; display: flex; align-items: center;"
      },
      "children": [
        {
          "componentName": "Text",
          "props": {
            "text": "页面标题",
            "style": "font-size: 18px; font-weight: bold;"
          }
        }
      ],
      "id": "header"
    },
    {
      "componentName": "div",
      "props": {
        "className": "page-content",
        "style": "flex: 1; padding: 20px; overflow: auto;"
      },
      "children": [...],
      "id": "content"
    }
  ],
  "id": "layout-root"
}
```

### 卡片网格布局

```json
{
  "componentName": "div",
  "props": {
    "className": "card-grid",
    "style": "display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;"
  },
  "children": [
    {
      "componentName": "div",
      "props": {
        "className": "card",
        "style": "border: 1px solid #ddd; border-radius: 4px; padding: 16px;"
      },
      "children": [...],
      "id": "card-1"
    }
  ],
  "id": "grid-container"
}
```

---

## 数据流模式

### 数据源加载

```json
{
  "state": {
    "dataList": []
  },
  "methods": {
    "loadData": {
      "type": "JSFunction",
      "value": "async function() { const data = await this.fetchData('list'); this.state.dataList = data; }"
    }
  },
  "lifeCycles": {
    "onMounted": {
      "type": "JSFunction",
      "value": "function onMounted() { this.loadData(); }"
    }
  }
}
```

### 键盘事件处理 (Enter 键提交)

```json
{
  "state": {
    "inputText": ""
  },
  "methods": {
    "handleInputKeyup": {
      "type": "JSFunction",
      "value": "function(event) { if (event.keyCode === 13) { this.submitForm(event); } }"
    },
    "submitForm": {
      "type": "JSFunction",
      "value": "function(event) { /* 处理提交逻辑 */ }"
    }
  },
  "children": [
    {
      "componentName": "TinyInput",
      "props": {
        "modelValue": {
          "type": "JSExpression",
          "value": "this.state.inputText",
          "model": true
        },
        "placeholder": "输入后按Enter提交",
        "onKeyup": {
          "type": "JSExpression",
          "value": "this.handleInputKeyup"
        }
      },
      "id": "input-submit"
    }
  ]
}
```

### 条件渲染 (v-if)

```json
{
  "state": {
    "isLoading": true,
    "hasError": false
  },
  "children": [
    {
      "componentName": "div",
      "props": {
        "condition": {
          "type": "JSExpression",
          "value": "this.state.isLoading"
        }
      },
      "children": [
        {
          "componentName": "Text",
          "props": {
            "text": "Loading..."
          }
        }
      ],
      "id": "loading-indicator"
    },
    {
      "componentName": "div",
      "props": {
        "condition": {
          "type": "JSExpression",
          "value": "this.state.hasError"
        }
      },
      "children": [
        {
          "componentName": "TinyAlert",
          "props": {
            "type": "error",
            "title": "加载失败"
          }
        }
      ],
      "id": "error-message"
    }
  ]
}
```

### 循环渲染 (v-for)

```json
{
  "state": {
    "items": [
      { "id": 1, "name": "Item 1" },
      { "id": 2, "name": "Item 2" }
    ]
  },
  "children": [
    {
      "componentName": "div",
      "props": {
        "key": {
          "type": "JSExpression",
          "value": "index"
        }
      },
      "children": [
        {
          "componentName": "Text",
          "props": {
            "text": {
              "type": "JSExpression",
              "value": "item.name"
            }
          },
          "id": "text-item"
        }
      ],
      "loop": {
        "type": "JSExpression",
        "value": "this.state.items"
      },
      "loopArgs": ["item", "index"],
      "id": "item-container"
    }
  ]
}
```

### 动态类名绑定

```json
{
  "state": {
    "isActive": false,
    "size": "large"
  },
  "children": [
    {
      "componentName": "div",
      "props": {
        "className": {
          "type": "JSExpression",
          "value": "['base-class', {'active': this.state.isActive, 'large': this.state.size === 'large'}]"
        }
      },
      "id": "dynamic-class-div"
    }
  ]
}
```

### 表格行操作

```json
{
  "componentName": "TinyGrid",
  "props": {
    "columns": [
      {
        "field": "actions",
        "title": "操作",
        "slots": {
          "default": {
            "type": "JSSlot",
            "params": ["row"],
            "value": [
              {
                "componentName": "TinyButton",
                "props": {
                  "text": "编辑",
                  "size": "small",
                  "onClick": {
                    "type": "JSExpression",
                    "value": "this.handleEdit",
                    "params": ["row"]
                  }
                },
                "id": "btn-edit"
              }
            ]
          }
        }
      }
    ]
  }
}
```

### 父子组件通信

```json
// 父组件
{
  "componentName": "div",
  "children": [
    {
      "componentName": "ChildBlock",
      "props": {
        "data": {
          "type": "JSExpression",
          "value": "this.state.parentData"
        },
        "onUpdate": {
          "type": "JSExpression",
          "value": "this.handleChildUpdate"
        }
      },
      "id": "child-block"
    }
  ]
}

// 子组件（区块）
{
  "componentName": "Block",
  "fileName": "ChildBlock",
  "props": {},
  "methods": {
    "emitChange": {
      "type": "JSFunction",
      "value": "function(newValue) { this.emit('update', newValue); }"
    }
  }
}
```

---

## 区块设计模式

### 可配置区块

```json
{
  "componentName": "Block",
  "fileName": "ConfigurableBlock",
  "schema": {
    "properties": [
      {
        "label": { "zh_CN": "基础信息" },
        "content": [
          {
            "property": "title",
            "type": "String",
            "defaultValue": "默认标题",
            "label": {
              "text": { "zh_CN": "标题" }
            },
            "widget": {
              "component": "MetaInput",
              "props": {}
            }
          },
          {
            "property": "showFooter",
            "type": "Boolean",
            "defaultValue": true,
            "label": {
              "text": { "zh_CN": "显示底部" }
            },
            "widget": {
              "component": "MetaSwitch",
              "props": {}
            }
          }
        ]
      }
    ],
    "events": {
      "onConfirm": {
        "label": { "zh_CN": "确认事件" }
      }
    }
  },
  "methods": {
    "handleConfirm": {
      "type": "JSFunction",
      "value": "function(event) { this.emit('confirm'); }"
    }
  },
  "children": [
    {
      "componentName": "div",
      "props": {
        "className": "block-content"
      },
      "children": [
        {
          "componentName": "Text",
          "props": {
            "text": {
              "type": "JSExpression",
              "value": "this.props.title"
            }
          }
        }
      ],
      "id": "block-content"
    },
    {
      "componentName": "div",
      "props": {
        "className": "block-footer",
        "condition": {
          "type": "JSExpression",
          "value": "this.props.showFooter"
        }
      },
      "children": [
        {
          "componentName": "TinyButton",
          "props": {
            "type": "primary",
            "text": "确认",
            "onClick": {
              "type": "JSExpression",
              "value": "this.handleConfirm"
            }
          }
        }
      ]
    }
  ]
}
```

### 带状态管理的区块

```json
{
  "componentName": "Block",
  "fileName": "StatefulBlock",
  "state": {
    "localData": [],
    "loading": false
  },
  "methods": {
    "fetchData": {
      "type": "JSFunction",
      "value": "async function() { this.state.loading = true; const data = await this.props.dataSource(); this.state.localData = data; this.state.loading = false; }"
    }
  },
  "lifeCycles": {
    "setup": {
      "type": "JSFunction",
      "value": "function setup({ props, watch, onMounted }) { watch(() => props.url, () => { this.fetchData(); }); }"
    }
  },
  "children": [
    {
      "componentName": "TinyGrid",
      "props": {
        "data": {
          "type": "JSExpression",
          "value": "this.state.localData"
        },
        "loading": {
          "type": "JSExpression",
          "value": "this.state.loading"
        }
      }
    }
  ]
}
```

### Watch 监听器 (响应式数据)

使用 `setup` 生命周期中的 `watch` 来监听数据变化：

```json
{
  "state": {
    "userId": "123",
    "userDetails": null
  },
  "methods": {
    "loadUserDetails": {
      "type": "JSFunction",
      "value": "async function(id) { /* 加载用户详情 */ }"
    }
  },
  "lifeCycles": {
    "setup": {
      "type": "JSFunction",
      "value": "function setup({ state, watch }) {\n  watch(() => state.userId, (newId, oldId) => {\n    if (newId !== oldId) {\n      this.loadUserDetails(newId);\n    }\n  });\n}"
    }
  }
}
```

**Watch 深度监听**:

```json
"setup": {
  "type": "JSFunction",
  "value": "function setup({ props, watch }) {\n  watch(() => props.list, (list) => {\n    // 列表变化时执行\n  }, { deep: true });\n}"
}
```

### 方法间相互调用

```json
{
  "methods": {
    "handleButtonClick": {
      "type": "JSFunction",
      "value": "function handleButtonClick(event) {\n  console.log('button click');\n  this.test('test param');\n}"
    },
    "test": {
      "type": "JSFunction",
      "value": "function test(name) {\n  console.log('test', name);\n}"
    }
  }
}
```

### 对话框确认操作

```json
{
  "state": {
    "dialogVisible": false
  },
  "methods": {
    "showConfirm": {
      "type": "JSFunction",
      "value": "function(event) { this.$modal.confirm({ message: '确定要执行此操作吗?' }).then(() => { this.doAction(); }); }"
    },
    "doAction": {
      "type": "JSFunction",
      "value": "async function() { /* 执行操作 */ }"
    }
  }
}
```

### 消息提示

```json
{
  "methods": {
    "showSuccess": {
      "type": "JSFunction",
      "value": "function(event) { this.$modal.message({ message: '操作成功!', status: 'success' }); }"
    },
    "showError": {
      "type": "JSFunction",
      "value": "function(event, msg) { this.$modal.message({ message: msg || '操作失败', status: 'error' }); }"
    }
  }
}
```

### 数组操作模式

```json
{
  "state": {
    "items": [{ "id": 1, "text": "Item 1" }]
  },
  "methods": {
    "addItem": {
      "type": "JSFunction",
      "value": "function(event, text) { this.state.items.push({ id: Date.now(), text: text }); }"
    },
    "removeItem": {
      "type": "JSFunction",
      "value": "function(event, id) { this.state.items = this.state.items.filter(item => item.id !== id); }"
    },
    "updateItem": {
      "type": "JSFunction",
      "value": "function(event, id, newText) { const item = this.state.items.find(i => i.id === id); if (item) { item.text = newText; } }"
    }
  }
}
```

```

```
