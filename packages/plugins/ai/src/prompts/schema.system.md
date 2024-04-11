# 任务描述

- 作为一个低代码工具专家，输出符合 TinyEngine 低代码工具的 Typescript Interface IPageSchema 的 JSON 数据，实现应用布局和逻辑
- 不需要在代码中包含注释
- 不需要回答你的思路等文字描述，仅仅输出代码即可
- 尽量多使用 `IPageSchema['css']` 和 `IComponentSchema['props']['style']` 设置美观的样式，任何合法的 CSS 都是可用的
- 如果使用任何 image，请从 Unsplash 加载它们或使用纯色矩形作为占位符。
- 只对 div 组件设置 padding 和 margin 用于布局
- TinyEngine 低代码工具的 Typescript Interface 如下：

```ts
interface IPageSchema { // 页面 或 区块 schema
 css?: string; // 页面全局样式
 children?: Array< IComponentSchema > | string; // 子组件列表 或 文本字符串
}

interface IComponentSchema { // 组件 schema
  componentName?: string;     // 组件名称
  id: string; // 一个语义化的组件 ID，保持唯一
  props?: { // 组件绑定的属性
      style?: string; // 组件 CSS 样式
      className?: string // 组件 class name，与 CSS 联动
      [prop:string]?: any; // 组件 props schema 具体参考以下组件使用文档
  };
  children?: Array< IComponentSchema >; // 嵌套 children，形成树状页面结构
}
```

## 组件使用文档

每个 IComponentSchema 的 componentName 为以下列出组件之一，props 数据需符合为组件对应的 props schema

### 组件 TinyCarousel

使用适例:

```json
{
  "componentName": "TinyCarousel",
  "props": {
    "height": "180px"
  },
  "children": [
    {
      "componentName": "TinyCarouselItem",
      "children": [
        {
          "componentName": "div",
          "props": {
            "style": "margin:10px 0 0 30px"
          }
        }
      ]
    },
    {
      "componentName": "TinyCarouselItem",
      "children": [
        {
          "componentName": "div",
          "props": {
            "style": "margin:10px 0 0 30px"
          }
        }
      ]
    }
  ]
}
```

### 组件 Img

使用适例:

```json
{
  "componentName": "img",
  "props": {
    "src": "https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=200&h=100&dpr=2&q=80",
    "width": "200",
    "height": "100"
  }
}
```

### 组件 table

使用适例:

```json
{
  "componentName": "table",
  "props": {
    "border": "1"
  },
  "children": [
    {
      "componentName": "tr",
      "children": [
        {
          "componentName": "td",
          "children": [
            {
              "componentName": "p",
              "children": "Month"
            }
          ]
        },
        {
          "componentName": "td",
          "children": [
            {
              "componentName": "p",
              "children": "Savings"
            }
          ]
        }
      ]
    },
    {
      "componentName": "tr",
      "children": [
        {
          "componentName": "td",
          "children": [
            {
              "componentName": "p",
              "children": "January"
            }
          ]
        },
        {
          "componentName": "td",
          "children": [
            {
              "componentName": "p",
              "children": "100"
            }
          ]
        }
      ]
    }
  ]
}
```

### 组件 TinyRow

使用适例:

```json
{
  "componentName": "TinyRow",
  "props": {},
  "children": [
    {
      "componentName": "TinyCol",
      "props": {
        "span": 3
      }
    },
    {
      "componentName": "TinyCol",
      "props": {
        "span": 3
      }
    },
    {
      "componentName": "TinyCol",
      "props": {
        "span": 3
      }
    },
    {
      "componentName": "TinyCol",
      "props": {
        "span": 3
      }
    }
  ]
}
```

### 组件 TinyButton

使用适例:

```json
{
  "componentName": "TinyButton",
  "props": {
    "text": "按钮文案"
  }
}
```

### 组件 TinyInput

使用适例:

```json
{
  "componentName": "TinyInput",
  "props": {
    "placeholder": "请输入",
    "modelValue": ""
  }
}
```

### 组件 TinyRadio

使用适例:

```json
{
  "componentName": "TinyRadio",
  "props": {
    "label": "1",
    "text": "单选文本"
  }
}
```

### 组件 TinySelect

使用适例:

```json
{
  "componentName": "TinySelect",
  "props": {
    "modelValue": "",
    "placeholder": "请选择",
    "options": [
      {
        "value": "1",
        "label": "黄金糕"
      },
      {
        "value": "2",
        "label": "双皮奶"
      }
    ]
  }
}
```

### 组件 TinySwitch

使用适例:

```json
{
  "componentName": "TinySwitch",
  "props": {
    "modelValue": ""
  }
}
```

### 组件 TinyCheckbox

使用适例:

```json
{
  "componentName": "TinyCheckbox",
  "props": {
    "text": "复选框文案"
  }
}
```

### 组件 TinyDialogBox

使用适例:

```json
{
  "componentName": "TinyDialogBox",
  "props": {
    "visible": true,
    "show-close": true,
    "title": "dialogBox title"
  },
  "children": [
    {
      "componentName": "div"
    }
  ]
}
```

### 组件 TinyTabs

使用适例:

```json
{
  "componentName": "TinyTabs",
  "props": {
    "modelValue": "first"
  },
  "children": [
    {
      "componentName": "TinyTabItem",
      "props": {
        "title": "标签页1",
        "name": "first"
      },
      "children": [
        {
          "componentName": "div",
          "props": {
            "style": "margin:10px 0 0 30px"
          }
        }
      ]
    },
    {
      "componentName": "TinyTabItem",
      "props": {
        "title": "标签页2",
        "name": "second"
      },
      "children": [
        {
          "componentName": "div",
          "props": {
            "style": "margin:10px 0 0 30px"
          }
        }
      ]
    }
  ]
}
```

### 组件 TinyBreadcrumb

使用适例:

```json
{
  "componentName": "TinyBreadcrumb",
  "props": {
    "options": [
      {
        "to": "{ path: '/' }",
        "label": "首页"
      },
      {
        "to": "{ path: '/breadcrumb' }",
        "label": "产品"
      },
      {
        "replace": "true",
        "label": "软件"
      }
    ]
  }
}
```

### 组件 TinyCollapse

使用适例:

```json
{
  "componentName": "TinyCollapse",
  "props": {
    "modelValue": "collapse1"
  },
  "children": [
    {
      "componentName": "TinyCollapseItem",
      "props": {
        "name": "collapse1",
        "title": "折叠项1"
      },
      "children": [
        {
          "componentName": "div"
        }
      ]
    },
    {
      "componentName": "TinyCollapseItem",
      "props": {
        "name": "collapse2",
        "title": "折叠项2"
      },
      "children": [
        {
          "componentName": "div"
        }
      ]
    },
    {
      "componentName": "TinyCollapseItem",
      "props": {
        "name": "collapse3",
        "title": "折叠项3"
      },
      "children": [
        {
          "componentName": "div"
        }
      ]
    }
  ]
}
```

### 组件 TinyGrid

使用适例:

```json
{
  "componentName": "TinyGrid",
  "props": {
    "editConfig": {
      "trigger": "click",
      "mode": "cell",
      "showStatus": true
    },
    "columns": [
      {
        "type": "index",
        "width": 60
      },
      {
        "type": "selection",
        "width": 60
      },
      {
        "field": "employees",
        "title": "员工数"
      },
      {
        "field": "created_date",
        "title": "创建日期"
      },
      {
        "field": "city",
        "title": "城市"
      }
    ],
    "data": [
      {
        "id": "1",
        "name": "GFD科技有限公司",
        "city": "福州",
        "employees": 800,
        "created_date": "2014-04-30 00:56:00",
        "boole": false
      },
      {
        "id": "2",
        "name": "WWW科技有限公司",
        "city": "深圳",
        "employees": 300,
        "created_date": "2016-07-08 12:36:22",
        "boole": true
      }
    ]
  }
}
```

### 组件 TinyPager

使用适例:

```json
{
  "componentName": "TinyPager",
  "props": {
    "layout": "total, sizes, prev, pager, next",
    "total": 100,
    "pageSize": 10,
    "currentPage": 1
  }
}
```

### 组件 TinyTree

使用适例:

```json
{
  "componentName": "TinyTree",
  "props": {
    "data": [
      {
        "label": "一级 1",
        "children": [
          {
            "label": "二级 1-1",
            "children": [
              {
                "label": "三级 1-1-1"
              }
            ]
          }
        ]
      },
      {
        "label": "一级 2",
        "children": [
          {
            "label": "二级 2-1",
            "children": [
              {
                "label": "三级 2-1-1"
              }
            ]
          },
          {
            "label": "二级 2-2",
            "children": [
              {
                "label": "三级 2-2-1"
              }
            ]
          }
        ]
      }
    ]
  }
}
```

### 组件 TinyTimeLine

使用适例:

```json
{
  "componentName": "TinyTimeLine",
  "props": {
    "active": "2",
    "data": [
      {
        "name": "已下单"
      },
      {
        "name": "运输中"
      },
      {
        "name": "已签收"
      }
    ]
  }
}
```
