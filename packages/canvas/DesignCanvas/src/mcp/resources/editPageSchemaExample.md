## State 示例

最小可行的 `add/update/remove`：

```json
{
  "section": "state",
  "strategy": "merge",
  "payload": {
    "add": { "companyName": "" },
    "update": { "buttons": [{ "type": "primary", "text": "主要操作" }] },
    "remove": ["deprecatedKey"]
  }
}
```

`accessor`（getter/setter）与 `computed`：

```json
{
  "section": "state",
  "strategy": "merge",
  "payload": {
    "add": {
      "fullName": {
        "defaultValue": "",
        "accessor": {
          "getter": { "type": "JSFunction", "value": "function getter(){ this.state.fullName = `${this.props.firstName} ${this.props.lastName}` }" },
          "setter": { "type": "JSFunction", "value": "function setter(){ const [firstName,lastName] = this.state.fullName.split(' '); this.emit('update:firstName', firstName); this.emit('update:lastName', lastName) }" }
        }
      }
    },
    "update": { "status": { "type": "JSExpression", "value": "this.statusData", "computed": true } }
  }
}
```

## CSS 示例

追加与覆盖：

```json
{ "section": "css", "strategy": "merge", "payload": { "css": ".page-base-style{ padding:24px; }" } }
{ "section": "css", "strategy": "replace", "payload": { "css": ".page-base-style{ margin:16px; }" } }
```

## LifeCycles 示例

```json
{
  "section": "lifeCycles",
  "strategy": "merge",
  "payload": {
    "add": {
      "setup": { "type": "JSFunction", "value": "function({ props, watch, onMounted }){ onMounted(()=>{ this.getTableData && this.getTableData() }) }" }
    }
  }
}
```

## Methods 示例

```json
{
  "section": "methods",
  "strategy": "merge",
  "payload": {
    "add": {
      "handleSearch": { "type": "JSFunction", "value": "function(e){ return ['搜索:', this.i18n('operation.search'), e] }" }
    }
  }
}
```

## 整页 Schema 示例

合并（仅顶层允许键）：

```json
{
  "section": "schema",
  "strategy": "merge",
  "payload": {
    "schema": { "fileName": "FormTable", "props": { "className": "page" } }
  }
}
```

替换（高风险）：

```json
{
  "section": "schema",
  "strategy": "replace",
  "payload": {
    "schema": { "componentName": "Page", "fileName": "NewPage", "children": [] }
  }
}
```

## 出码示例

详见设计器示例（参考 `tools/example.md` 对应片段）。

## Do & Don’t

- Do：在不确定结构时先调用 `get_page_schema` 再决定策略。
- Do：对 CSS 小步追加，避免一次性覆盖。
- Don’t：将 `state` 写成数组；应为对象（map）。
- Don’t：给 `lifeCycles/methods` 传非 `JSFunction` 单元。

