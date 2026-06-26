---
name: tinyengine-dsl-generator
description: Use when creating or modifying TinyEngine low-code applications - generating page, block, or app DSL (JSON schemas), converting designs/screenshots to DSL, or debugging generated TinyEngine JSON.
---

# TinyEngine DSL Generator

Generate conformant DSL (JSON) for the TinyEngine low-code platform: **pages**, **blocks**, and **apps**. This file is a router — load the reference files on demand for detail instead of reading everything up front.

## Quick Reference

| Task               | Do                                                    |
| ------------------ | ----------------------------------------------------- |
| Generate page DSL  | Describe components, layout, interactions → §Workflow |
| Generate block DSL | Describe reusable functionality + configurable props |
| Generate app DSL   | Describe multi-page structure + shared componentsMap  |
| From screenshot    | Describe layout → map to components (§Design-to-DSL)  |
| Lookup a component | `node scripts/query_components.mjs props <Name>`      |
| Validate output    | `bash scripts/validate_all.sh <file>` (required)      |

## Workflow

1. **Understand the goal** — Page (components / state / methods / lifeCycles), Block (reusable, exposes a props `schema`), or App (pages + `componentsMap` + `meta`).
2. **Gather requirements** — name / route / title; component hierarchy; state; event handlers; data sources. Blocks additionally: exposed props, emitted events. Apps additionally: all pages, shared `componentsMap`.
3. **Load only the reference you need:**

   | Need                                                        | File                                                       |
   | ----------------------------------------------------------- | ---------------------------------------------------------- |
   | Schema structure, TS interfaces, reserved names, prop types | [protocol.md](references/protocol.md)                      |
   | Component props/events, or a component not listed here      | [components.md](references/components.md) · `query_components.mjs` |
   | List page / form page / layout / interaction templates      | [patterns.md](references/patterns.md)                      |

   ⚠️ **Before generating any page with interactions**, read the event-binding section of [protocol.md](references/protocol.md). Event handlers are the #1 error source; the compact Critical Rules table below is a reminder, not a substitute for the full ❌/✅ example.

4. **Generate** — follow the Page skeleton + property types below. Full Page/Block/Component interfaces are in protocol.md.
5. **Validate** (required) — see §Validate.
6. **Run the checklist** before handing off — see §Pre-Generation Checklist.

### Page skeleton (anchor)

```json
{
  "componentName": "Page",
  "fileName": "PageName",
  "meta": { "id": 1, "title": "...", "router": "...", "creator": "...", "isHome": false, "parentId": "0", "rootElement": "div", "group": "staticPages" },
  "state": {},
  "methods": {},
  "lifeCycles": {},
  "children": []
}
```

### Property value types

- **Literal**: `"text"`, `123`, `true`
- **JSExpression**: `{"type":"JSExpression","value":"this.state.count"}` — bindings, conditions, **event handlers**
- **JSFunction**: `{"type":"JSFunction","value":"function(){}"}` — **only** inside `methods` / `lifeCycles`
- **i18n**: `{"type":"i18n","key":"app.title"}`
- **JSResource**: `{"type":"JSResource","value":"this.utils.format()"}`

### Referencing a block

```json
{ "componentName": "BlockFileName", "componentType": "block", "id": "block-001", "props": { "title": "value" } }
```

Inside the block: read `this.props.xxx`, emit via `this.emit('eventName', data)`.

## Critical Rules (common pitfalls)

These cause silent failures. Full ❌/✅ JSON examples live in [protocol.md](references/protocol.md); the checklist below enforces them.

| Rule               | ❌ Wrong                                                                       | ✅ Right                                                                                          |
| ------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| **Event bindings** | `"onClick":{"type":"JSFunction",...}`; or `JSExpression.value` = `"function…"` | `"onClick":{"type":"JSExpression","value":"this.handleX"}` — put the body in `methods` as `JSFunction` |
| **Method params**  | `function(filter){...}`                                                        | `function(event, filter){...}`; binding `"params":["'all'"]` → call `handleX(event,'all')`        |
| **Lifecycle name** | `"mounted":{...}`                                                              | `"onMounted":{"type":"JSFunction","value":"function onMounted(){...}"}`                           |
| **Two-way binding**| `modelValue` with **no** `model`                                               | `"model":true` (v-model) or `"model":{"prop":"x"}` (v-model:x)                                    |
| **Page editable**  | `"occupier": {...}`                                                            | `"occupier": null`                                                                                |
| **CSS class**      | `props.class`                                                                  | `props.className`                                                                                 |

### Event bindings — the full pattern (highest-frequency error)

The function body lives in `methods` (`JSFunction`); the event only **references** it (`JSExpression`). `event` is always the first arg; `params` append after.

```json
"methods": {
  "handleDelete": {
    "type": "JSFunction",
    "value": "function(event, id) { this.state.list = this.state.list.filter(x => x.id !== id); }"
  }
},
"children": [{
  "componentName": "TinyButton",
  "props": {
    "text": "删除",
    "onClick": { "type": "JSExpression", "value": "this.handleDelete", "params": ["123"] }
  }
}]
```

The binding above calls `handleDelete(event, 123)`. ❌ Never put a `JSFunction` on an event, and never put a `function(){}` body inside a `JSExpression.value` — both silently break the handler.

**Memory aid:** `JSExpression` = reference (`this.fn`) · `JSFunction` = definition (`function(){}`). Events use references; methods use definitions.

## Validate (required)

```bash
bash .agents/skills/tinyengine-dsl-generator/scripts/validate_all.sh <output-file>
```

`validate_all.sh` chains three checks — do **not** rely on `validate_dsl.mjs` alone (it misses event-binding errors). Fix and re-run until all three pass; never hand off unvalidated output.

| Stage          | Script                   | Catches                                                                         |
| -------------- | ------------------------ | ------------------------------------------------------------------------------- |
| Structure      | validate_dsl.mjs         | Required fields, Page/Block `componentName`, meta, `class` vs `className`, app/page id types |
| Event bindings | check_event_bindings.mjs | `JSFunction` on an event, or a function body in `JSExpression.value`           |
| CSS            | check_css.mjs            | Malformed `css` strings                                                         |

## Pre-Generation Checklist

- [ ] Event bindings use `JSExpression`; no `value` starts with `"function"`; function bodies live in `methods` / `lifeCycles`
- [ ] Event methods take `event` as the first parameter; `params` append after it
- [ ] Lifecycle names start with `on` (`onMounted`, …); `setup` is the only exception
- [ ] `modelValue` declares `model` (`true` for standard v-model)
- [ ] `occupier` is `null`
- [ ] All `id`s are unique; CSS classes use `className`, not `class`
- [ ] **App schema** `id` and `meta.appId` are integers (`918`, not `"918"`) — apps.js persists `meta.appId` as string internally, keep the DSL integer
- [ ] **Page** `app` reference is a string (`"918"`, not `918`) — pages.js queries with `appId.toString()`; a numeric `app` won't be found by `list()`. Page's own `id` is a NanoID string assigned by the server

## Component lookup

Don't load `bundle.json` (≈1 MB) by hand. Query it:

```bash
node scripts/query_components.mjs list              # all components
node scripts/query_components.mjs props TinyButton  # one component's props (fuzzy match)
node scripts/query_components.mjs cat 表单          # components in a category
node scripts/query_components.mjs search 表格       # full-text search
```

## File output

- **Apps** → `mockServer/data/apps/<app-name>.json`
- **Pages** → `mockServer/data/pages/<PageName>.json`
- **Blocks** → `mockServer/data/blocks/<BlockName>.json`

Pages and blocks are saved with an **outer wrapper** around the DSL: page files wrap the Page DSL in `page_content` (plus `name`, `id`, `app`, `route`, `tenant`, `parentId`, `group`, `isPage`, `isHome`); block files wrap the Block DSL in `content` (plus `id`, `label`, `framework`, `path`, `public`, `is_published`). The validators auto-unwrap both, so you can validate either the wrapper or the inner DSL directly.

## Design-to-DSL

From a description or screenshot: identify layout regions → map visuals to components → extract interactions → define state + handlers → apply `className` / `style`.

## Troubleshooting

| Problem           | Check                                                                  |
| ----------------- | ---------------------------------------------------------------------- |
| Input not working | `modelValue` declares `model` (`true` for standard v-model)            |
| Event not firing  | `JSExpression` (not `JSFunction`); method exists in `methods`          |
| Page not editable | `occupier` is `null`                                                   |
| Wrong params      | first param is always `event`; `params` append after                   |

## Resources

- [protocol.md](references/protocol.md) — schema spec, TS interfaces, reserved names, property types, slots, full ❌/✅ examples
- [components.md](references/components.md) — component catalog (props/events); supplement with `query_components.mjs`
- [patterns.md](references/patterns.md) — list/form page, layout, interaction templates
- `scripts/` — `validate_all.sh` (run this), `validate_dsl.mjs`, `check_event_bindings.mjs`, `check_css.mjs`, `validate_page.mjs`, `query_components.mjs`
