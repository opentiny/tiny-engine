---
name: tinyengine-dsl-generator
description: Generate TinyEngine low-code platform DSL files - page, block, and app JSON schemas. Use when creating or modifying TinyEngine applications. Supports complete app generation, single page DSL with components and block references, reusable block DSL with configurable props, design-to-DSL conversion from screenshots, and template-based generation for common patterns like list pages, form pages, and dashboards.
---

# TinyEngine DSL Generator

Generate conformant DSL (JSON schemas) for TinyEngine low-code platform applications.

## Quick Reference

| Task               | Command/Approach                                        |
| ------------------ | ------------------------------------------------------- |
| Generate page DSL  | Describe the page components, layout, and interactions  |
| Generate block DSL | Describe reusable functionality with configurable props |
| Generate app DSL   | Describe multi-page application structure               |
| From screenshot    | Provide image with description of desired layout        |
| Validate DSL       | Run `scripts/validate_dsl.py <file>`                    |

## DSL Generation Workflow

### 1. Understand the Goal

Identify what to generate:

- **Page**: A single page with components, state, methods, lifecycle
- **Block**: A reusable component with props schema for configuration
- **App**: Complete application with multiple pages, componentsMap, meta

### 2. Gather Requirements

For **Pages**, collect:

- Page name, route, title, description
- Components hierarchy (layout, forms, tables, etc.)
- State management needs
- Event handlers and methods
- Data sources (if any)

For **Blocks**, additionally collect:

- Exposed props (name, type, default, widget)
- Events that the block emits
- Whether it needs internal state

For **Apps**, additionally collect:

- All pages in the application
- Shared componentsMap
- Application-level configuration

### 3. Reference Protocol

See [references/protocol.md](references/protocol.md) for:

- Complete schema structure definitions
- Reserved component names (Page, Block, Text, etc.)
- Property value types (JSExpression, i18n, JSFunction, JSResource)
- Slot syntax for template usage

See [references/components.md](references/components.md) for:

- Available components (TinyButton, TinyGrid, etc.)
- Component props and events
- Usage examples

See [references/patterns.md](references/patterns.md) for:

- List page template
- Form page template
- Common interaction patterns
- Layout patterns

### 4. Generate the DSL

Follow the schema structure exactly:

**Page Structure**:

```json
{
  "componentName": "Page",
  "fileName": "PageName",
  "meta": { "id": 1, "title": "...", "router": "...", "creator": "...", "isHome": false, "parentId": "0", "rootElement": "div", "group": "staticPages" },
  "state": {},
  "methods": {},
  "lifeCycles": {},
  "children": [...]
}
```

**Block Structure**:

```json
{
  "componentName": "Block",
  "fileName": "BlockName",
  "schema": { "properties": [...], "events": {} },
  "props": {},
  "state": {},
  "methods": {},
  "lifeCycles": {},
  "children": [...]
}
```

**Component in children**:

```json
{
  "componentName": "TinyButton",
  "id": "unique-id",
  "props": {
    "text": "Button Text",
    "type": "primary",
    "onClick": { "type": "JSExpression", "value": "this.handleButtonClick" }
  }
}
```

**Property Value Types**:

- Literal: `"text"`, `123`, `true`
- JSExpression: `{"type": "JSExpression", "value": "this.state.count"}`
- i18n: `{"type": "i18n", "key": "app.title"}`
- JSFunction: `{"type": "JSFunction", "value": "function() {}"}` - Only for methods and lifeCycles
- JSResource: `{"type": "JSResource", "value": "this.utils.format()"}`

### 5. Using Blocks

When a page references a block:

```json
{
  "componentName": "BlockFileName",
  "componentType": "block",
  "id": "block-001",
  "props": {
    "configurableProp": "value",
    "dataBinding": {
      "type": "JSExpression",
      "value": "this.state.dataSource"
    }
  }
}
```

Block receives props via `this.props.xxx` and emits events via `this.emit('eventName', data)`.

### 6. Validate the Output

Run the validator:

```bash
python3 /path/to/skill/scripts/validate_dsl.py <output-file>
```

The validator checks:

- Required fields presence
- Correct componentName for Page/Block
- Valid meta structure
- Component ID recommendations

### 7. Pre-Generation Checklist (Before Finalizing)

Before finalizing any TinyEngine DSL generation, verify:

**Event Bindings**:

- [ ] All event bindings (`onClick`, `onChange`, `onKeyup`, etc.) use `JSExpression` type
- [ ] No `JSExpression.value` starts with `"function"`
- [ ] All `JSExpression.value` are method references like `this.methodName`
- [ ] All function definitions are in `methods` or `lifeCycles` with `JSFunction` type

**Model Bindings**:

- [ ] All `modelValue` bindings have `"model": true` (for standard v-model)
- [ ] State variables referenced in modelValue exist in `state` object

**App ID Format** (统一使用整数):

- [ ] App Schema `id` is integer (e.g., `918`)
- [ ] App Schema `meta.appId` is integer (e.g., `918`)
- [ ] App Metadata `id` is integer (e.g., `918`)
- [ ] Page Files `app` is integer (e.g., `918`)

**Other Checks**:

- [ ] Event handler methods have `event` as first parameter
- [ ] `params` in event bindings append after `event` parameter
- [ ] Lifecycle names start with `on` (e.g., `onMounted`, not `mounted`)
- [ ] `occupier` is `null` (for pages to be editable)
- [ ] All component IDs are unique
- [ ] All CSS classes use `className` (NOT `class`)

## Critical Rules (Common Pitfalls)

### Event Binding - Use JSExpression, NOT JSFunction

**❌ WRONG #1** - Event binding with JSFunction:

```json
"onClick": {
  "type": "JSFunction",
  "value": "function() { this.setFilter('all'); }"
}
```

**❌ WRONG #2** - JSExpression with function definition in value:

```json
"onClick": {
  "type": "JSExpression",
  "value": "function(event) { this.state.selectedTodos = []; }"
}
```

**✅ CORRECT** - Event binding with JSExpression referencing method:

```json
"onClick": {
  "type": "JSExpression",
  "value": "this.setFilter",
  "params": ["'all'"]
}
```

**Rule**: Event bindings must use `JSExpression` to reference methods defined in the `methods` object. The actual function definition goes in `methods`, not in the event binding.

**Memory Aid**:

- `JSExpression` = Reference (e.g., `this.methodName`)
- `JSFunction` = Definition (e.g., `function() {...}`)
- Event bindings use references (`JSExpression`), method definitions use functions (`JSFunction`)

### Method Parameters - Event is Always First

Methods bound to events receive `event` as the first parameter automatically. Additional parameters via `params` are appended after.

**Method definition** (in `methods`):

```json
"setFilter": {
  "type": "JSFunction",
  "value": "function(event, filter) { this.state.filter = filter; }"
}
```

**Event binding**:

```json
"onClick": {
  "type": "JSExpression",
  "value": "this.setFilter",
  "params": ["'all'"]  // Actual call: setFilter(event, 'all')
}
```

**With multiple parameters**:

```json
"handleCheckboxChange": {
  "type": "JSFunction",
  "value": "function(event, row) { this.toggleTodo(event, row.id); }"
}

"onChange": {
  "type": "JSExpression",
  "value": "this.handleCheckboxChange",
  "params": ["row"]  // Actual call: handleCheckboxChange(event, row)
}
```

### LifeCycles - Use onMounted with Complete Function

**❌ WRONG**:

```json
"lifeCycles": {
  "mounted": {
    "type": "JSFunction",
    "value": "function() { this.loadTodos(); }"
  }
}
```

**✅ CORRECT**:

```json
"lifeCycles": {
  "onMounted": {
    "type": "JSFunction",
    "value": "function onMounted() { this.loadTodos(); }"
  }
}
```

**Rules**:

- Lifecycle names must start with `on` (e.g., `onMounted`, `onBeforeMount`)
- Use complete function body with function name
- Available: `setup`, `onBeforeMount`, `onMounted`, `onUnmounted`, `onUpdated`, `onBeforeUpdate`

### Two-Way Binding - model Should Be true

**❌ WRONG**:

```json
"modelValue": {
  "type": "JSExpression",
  "value": "this.state.newTodo",
  "model": {
    "prop": "newTodo"
  }
}
```

**✅ CORRECT**:

```json
"modelValue": {
  "type": "JSExpression",
  "value": "this.state.newTodo",
  "model": true
}
```

**Rule**: For standard v-model, set `model: true`. Only use object form for v-model:{propName} (rare).

### Occupier Field - Must Be null

**❌ WRONG**:

```json
"occupier": {
  "id": 1,
  "username": "admin"
}
```

**✅ CORRECT**:

```json
"occupier": null
```

**Rule**: `occupier` must be `null` to allow page editing.

### CSS Class Names - Use className, NOT class

**❌ WRONG**:

```json
{
  "componentName": "div",
  "props": {
    "class": "container"
  }
}
```

**✅ CORRECT**:

```json
{
  "componentName": "div",
  "props": {
    "className": "container"
  }
}
```

**Rule**: In TinyEngine DSL, always use `className` for CSS classes, not `class`. This follows React/Vue convention.

### CSS Field - Prefer Single-Line Format

**Recommended (single-line)**:

```json
{
  "componentName": "Page",
  "css": ".container { padding: 20px; background: #fff; } .title { font-size: 18px; }"
}
```

**Alternative (multi-line with escapes)** - Use for complex styles:

```json
{
  "componentName": "Page",
  "css": ".container {\n  padding: 20px;\n  background: #fff;\n}\n\n.title {\n  font-size: 18px;\n}"
}
```

**Rules**:

- For simple styles, use single-line CSS for cleaner JSON
- For complex styles with many properties, use multi-line with `\n` escapes for better readability
- Use standard CSS syntax
- Avoid complex selectors when possible

### Dynamic List Rendering with Slots

Use TinyGrid with slots for dynamic lists:

```json
{
  "componentName": "TinyGrid",
  "props": {
    "data": {
      "type": "JSExpression",
      "value": "this.getFilteredTodos()"
    },
    "columns": [
      {
        "field": "text",
        "title": "Task",
        "slots": {
          "default": {
            "type": "JSSlot",
            "params": ["row"],
            "value": [
              {
                "componentName": "Text",
                "props": {
                  "text": {
                    "type": "JSExpression",
                    "value": "row.text"
                  }
                }
              }
            ]
          }
        }
      }
    ]
  }
}
```

### Conditional Rendering

Use `condition` property for v-if behavior:

```json
{
  "componentName": "div",
  "props": {
    "condition": {
      "type": "JSExpression",
      "value": "this.getFilteredTodos().length === 0"
    }
  },
  "children": [
    {
      "componentName": "Text",
      "props": {
        "text": "No todos yet!"
      }
    }
  ]
}
```

### Input Enter Key Handling

```json
// Method in methods
"handleInputKeyup": {
  "type": "JSFunction",
  "value": "function(event) { if (event.keyCode === 13) this.addTodo(event); }"
}

// Binding
"onKeyup": {
  "type": "JSExpression",
  "value": "this.handleInputKeyup"
}
```

## Common Patterns

### List Page with Search

```json
{
  "state": {
    "tableData": [],
    "searchForm": {},
    "pagination": { "currentPage": 1, "pageSize": 10, "total": 0 }
  },
  "methods": {
    "fetchData": {
      "type": "JSFunction",
      "value": "async function() { /* load data */ }"
    },
    "handleSearch": {
      "type": "JSFunction",
      "value": "function() { this.state.pagination.currentPage = 1; this.fetchData(); }"
    }
  },
  "children": [
    { "componentName": "TinyForm", "children": [...] },
    { "componentName": "TinyGrid", "props": { "data": { "type": "JSExpression", "value": "this.state.tableData" } } },
    { "componentName": "TinyPager", "props": {...} }
  ]
}
```

### Form Page with Validation

```json
{
  "state": {
    "formData": {},
    "rules": {
      "name": [{ "required": true, "message": "Required" }]
    }
  },
  "methods": {
    "handleSubmit": {
      "type": "JSFunction",
      "value": "async function() { const valid = await this.$refs.formRef.validate(); if (valid) { /* submit */ } }"
    }
  },
  "children": [
    {
      "componentName": "TinyForm",
      "props": {
        "ref": "formRef",
        "modelValue": { "type": "JSExpression", "value": "this.state.formData" },
        "rules": { "type": "JSExpression", "value": "this.state.rules" }
      },
      "children": [...]
    }
  ]
}
```

### Configurable Block

```json
{
  "componentName": "Block",
  "fileName": "ConfigurableCard",
  "schema": {
    "properties": [
      {
        "label": { "zh_CN": "Config" },
        "content": [
          {
            "property": "title",
            "type": "String",
            "defaultValue": "Default Title",
            "label": { "text": { "zh_CN": "Title" } },
            "widget": { "component": "MetaInput" }
          }
        ]
      }
    ]
  },
  "children": [
    {
      "componentName": "Text",
      "props": {
        "text": { "type": "JSExpression", "value": "this.props.title" }
      }
    }
  ]
}
```

## Reserved Component Names

DO NOT use these as custom component names:

- `Page` - Page container
- `Block` - Block container
- `Component` - Business component container (reserved)
- `Template` - Virtual container for slots
- `Slot` - Slot definition
- `Collection` - Data source container
- `Text` - Text node (renders as span)

## Component Resources

- **Components available**: See `designer-demo/public/mock/bundle.json` in the project
- **Categories**: general, html, 容器组件, 图表组件, 评分组件, 进度条, etc.
- **Common components**: TinyButton, TinyInput, TinyGrid, TinySelect, TinyForm, TinyDialogBox, TinyTabs

## File Output

Generated DSL files should be placed:

- **Apps**: `mockServer/data/apps/<app-name>.json`
- **Pages**: `mockServer/data/pages/<PageName>.json`
- **Blocks**: `mockServer/data/blocks/<BlockName>.json`

Page file structure (wrapper):

```json
{
  "name": "PageName",
  "id": "unique-id",
  "app": 1,
  "route": "page-route",
  "page_content": {
    /* actual page DSL with componentName: "Page" */
  },
  "tenant": 1,
  "parentId": "0",
  "group": "staticPages",
  "isPage": true,
  "isHome": false
}
```

Block file structure (wrapper):

```json
{
  "id": "unique-id",
  "label": "BlockLabel",
  "framework": "Vue",
  "content": {
    /* actual block DSL with componentName: "Block" */
  },
  "path": "category",
  "public": 1,
  "is_published": true
}
```

## Design-to-DSL

When converting from a design description or screenshot:

1. Identify the layout structure (header, sidebar, content)
2. Map visual elements to TinyEngine components
3. Extract interactive elements (buttons, forms, navigation)
4. Define state for dynamic content
5. Add event handlers for interactions
6. Apply appropriate CSS classes or inline styles

## Troubleshooting

| Problem           | Check                                                               |
| ----------------- | ------------------------------------------------------------------- |
| Input not working | Verify `modelValue` has `model: true`                               |
| Event not firing  | Use `JSExpression` (not `JSFunction`), check method name is correct |
| Page not editable | Ensure `occupier` is `null`                                         |
| Wrong parameters  | First parameter is always `event`, params append after              |

## Resources

### references/protocol.md

Complete DSL protocol specification with TypeScript interfaces for all schema types.

### references/components.md

Component catalog with props, events, and usage examples.

### references/patterns.md

Template patterns for common page types and interaction flows.

### scripts/validate_dsl.py

Python validator for generated DSL files. Run before finalizing output.
