# TinyEngine Components Reference

本文档包含 TinyEngine 可用组件的快速参考。

## 组件来源

组件清单位于项目根目录的 `designer-demo/public/mock/bundle.json` 文件中。

## 组件分类

| 分类         | 组件数量 | 说明              |
| ------------ | -------- | ----------------- |
| general      | 1+       | 通用基础组件      |
| html         | 10       | HTML 原生元素     |
| 容器组件     | 2        | 布局容器          |
| 图表组件     | 12       | 数据可视化        |
| 组件         | 8        | 业务组件          |
| 评分组件     | 1        | 评分输入          |
| 进度条       | 1        | 进度显示          |
| 骨架屏       | 1        | 加载占位          |
| 滑块组件     | 1        | 滑块输入          |
| 步骤条       | 1        | 步骤导航          |
| element-plus | 7        | Element Plus 组件 |
| Other        | 33+      | 其他组件          |

## 常用基础组件

### 按钮 (TinyButton)

```typescript
interface TinyButtonProps {
  text: string // 按钮文字
  type: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  size: 'medium' | 'small' | 'mini'
  disabled: boolean
  plain: boolean // 朴素按钮
  round: boolean // 圆角
  circle: boolean // 圆形
  loading: boolean // 加载中
  icon: string // 图标类名
  onClick: JSFunction // 点击事件
}
```

### 输入框 (TinyInput)

```typescript
interface TinyInputProps {
  modelValue: string | number;
  type: 'text' | 'number' | 'password' | 'textarea';
  placeholder: string;
  disabled: boolean;
  readonly: boolean;
  clearable: boolean;        // 可清空
  size: 'medium' | 'small' | 'mini';
  maxlength: number;
  onChange: JSExpression;    // ⚠️ 使用 JSExpression 引用方法
  onFocus: JSExpression;
  onBlur: JSExpression;
  onKeyup: JSExpression;     // 键盘事件 (如 Enter 键处理)
}

// ⚠️ 双向绑定示例:
"modelValue": {
  "type": "JSExpression",
  "value": "this.state.inputText",
  "model": true  // 标准双向绑定 (v-model)
}

// ⚠️ 事件绑定示例:
"onChange": {
  "type": "JSExpression",
  "value": "this.handleInputChange"
}

// methods 中定义:
"handleInputChange": {
  "type": "JSFunction",
  "value": "function(event) { this.state.inputText = event; }"
}

// Enter 键处理示例:
"onKeyup": {
  "type": "JSExpression",
  "value": "this.handleInputKeyup"
}

// methods 中定义:
"handleInputKeyup": {
  "type": "JSFunction",
  "value": "function(event) { if (event.keyCode === 13) { this.submitForm(event); } }"
}
```

### 表格 (TinyGrid)

```typescript
interface TinyGridProps {
  data: Array<any> // 表格数据
  columns: Array<{
    // 列配置
    field: string
    title: string
    width?: number
    fixed?: 'left' | 'right'
    align?: 'left' | 'center' | 'right'
    editor?: {
      component: string
      type?: 'visible' | 'default'
    }
  }>
  border: boolean
  stripe: boolean // 斑马纹
  height: string | number
  autoResize: boolean
}
```

### 对话框 (TinyDialogBox)

```typescript
interface TinyDialogBoxProps {
  visible: boolean // 是否显示
  title: string
  width: string
  fullscreen: boolean
  top: string
  modal: boolean
  lockScroll: boolean
  beforeClose: JSFunction
  onClose: JSFunction
}
```

### 选择器 (TinySelect)

```typescript
interface TinySelectProps {
  modelValue: string | number | Array<any>
  multiple: boolean
  disabled: boolean
  clearable: boolean
  placeholder: string
  options: Array<{
    label: string
    value: any
    disabled?: boolean
  }>
  remote: boolean // 远程搜索
  remoteMethod: JSFunction
  onChange: JSFunction
}
```

### 标签页 (TinyTabs)

```typescript
interface TinyTabsProps {
  activeName: string
  type: '' | 'card' | 'border-card'
  tabPosition: 'top' | 'right' | 'bottom' | 'left'
  stretch: boolean
  onTabClick: JSFunction
}

// 子项 TinyTabItem
interface TinyTabItemProps {
  title: string
  name: string
  disabled: boolean
}
```

### 表单 (TinyForm)

```typescript
interface TinyFormProps {
  modelValue: Record<string, any>;
  rules: Record<string, any>; // 校验规则
  labelWidth: string;
  labelPosition: 'left' | 'right' | 'top';
  inline: boolean;
  disabled: boolean;
  validate: JSExpression;
  resetFields: JSExpression;
}

// ⚠️ 表单双向绑定示例:
"modelValue": {
  "type": "JSExpression",
  "value": "this.state.formData",
  "model": true  // 标准双向绑定 (v-model)
}

// ⚠️ 表单内输入框双向绑定:
"modelValue": {
  "type": "JSExpression",
  "value": "this.state.formData.name",
  "model": true  // 标准双向绑定用 true；{prop} 仅用于具名 v-model (v-model:xxx)
}

// 表单验证示例:
"methods": {
  "handleSubmit": {
    "type": "JSFunction",
    "value": "async function(event) { const valid = await this.$refs.formRef.validate(); if (valid) { /* 提交表单 */ } }"
  }
}

// 表单项 TinyFormItem
interface TinyFormItemProps {
  label: string;
  prop: string;
  required: boolean;
  rules: Array<any>;
}
```

### 布局组件

#### 容器 (div)

```typescript
interface DivProps {
  className: string
  style: string
}
```

#### Span (span)

```typescript
interface SpanProps {
  className: string
  style: string
}
```

#### 图标 (Icon)

```typescript
interface IconProps {
  name: string // 图标名称，如 "IconChevronLeft"
  style: string
  className: string
}
```

#### 文本 (Text)

```typescript
interface TextProps {
  text: string | II18n // 支持i18n
  style: string
  className: string
}
```

### 数据展示

#### 树形控件 (TinyTree)

```typescript
interface TinyTreeProps {
  data: Array<{
    label: string
    children?: Array<any>
    id: string | number
  }>
  showCheckbox: boolean
  checkOnClickNode: boolean
  defaultExpandAll: boolean
  filterNodeMethod: JSFunction
  onCheckChange: JSFunction
  onNodeClick: JSFunction
}
```

#### 分页 (TinyPager)

```typescript
interface TinyPagerProps {
  currentPage: number
  pageSizes: Array<number>
  pageSize: number
  total: number
  layout: string // 如 "total, sizes, prev, pager, next, jumper"
  onCurrentChange: JSFunction
  onSizeChange: JSFunction
}
```

#### 进度条 (TinyProgress)

```typescript
interface TinyProgressProps {
  percentage: number // 0-100
  type: 'line' | 'circle' | 'dashboard'
  status: 'success' | 'exception' | 'warning'
  strokeWidth: number
  color: string | string[]
}
```

### 开关和选择

#### 开关 (TinySwitch)

```typescript
interface TinySwitchProps {
  modelValue: boolean
  disabled: boolean
  width: number
  activeText: string
  inactiveText: string
  onChange: JSFunction
}
```

#### 单选框 (TinyRadio)

```typescript
interface TinyRadioProps {
  modelValue: string | number | boolean
  label: string | number
  disabled: boolean
  border: boolean
  onChange: JSFunction
}

// 单选组 TinyRadioGroup
interface TinyRadioGroupProps {
  modelValue: any
  size: 'medium' | 'small' | 'mini'
  fill: string
  textColor: string
  onChange: JSFunction
}
```

#### 复选框 (TinyCheckbox)

```typescript
interface TinyCheckboxProps {
  modelValue: boolean | string | number
  label: string
  trueLabel: string
  falseLabel: string
  disabled: boolean
  border: boolean
  onChange: JSFunction
}

// 复选组 TinyCheckboxGroup
interface TinyCheckboxGroupProps {
  modelValue: Array<any>
  size: string
  min: number
  max: number
  onChange: JSFunction
}
```

#### 日期选择 (TinyDatePicker)

```typescript
interface TinyDatePickerProps {
  modelValue: string | Date
  type: 'year' | 'month' | 'date' | 'dates' | 'week' | 'datetime' | 'datetimerange' | 'daterange'
  placeholder: string
  startPlaceholder: string
  endPlaceholder: string
  format: string
  disabled: boolean
  clearable: boolean
  onChange: JSFunction
}
```

### 消息提示

#### 警告 (TinyAlert)

```typescript
interface TinyAlertProps {
  title: string
  type: 'success' | 'warning' | 'info' | 'error'
  description: string
  closable: boolean
  center: boolean
  closeText: string
  showIcon: boolean
}
```

#### 消息 (TinyModal)

```typescript
// 使用方法
{
  "type": "JSResource",
  "value": "this.$modal.message({ message: '操作成功', status: 'success' })"
}
```

#### 确认框 (TinyConfirm)

```typescript
// 使用方法
{
  "type": "JSResource",
  "value": "this.$modal.confirm({ message: '确定删除?' }).then(() => {})"
}
```

## 图表组件

### 折线图 (TinyLineChart)

```typescript
interface TinyLineChartProps {
  data: Array<any>
  settings: {
    dimensions?: string[]
    metrics?: string[]
    xAxisType?: 'category' | 'value' | 'time'
    yAxisType?: 'category' | 'value' | 'time'
    yAxisName?: string[]
    area?: boolean
  }
}
```

### 柱状图 (TinyBarChart)

```typescript
interface TinyBarChartProps {
  data: Array<any>
  settings: {
    dimensions?: string[]
    metrics?: string[]
    axisSite?: { top?: string[] }
    label?: { show?: boolean }
  }
}
```

### 饼图 (TinyPieChart)

```typescript
interface TinyPieChartProps {
  data: Array<any>
  settings: {
    dimension?: string
    metrics?: string[]
    radius?: number | number[]
  }
}
```

## 组件查询

不要手动 grep bundle.json（≈1MB）。用查询脚本：

```bash
node scripts/query_components.mjs props TinyButton   # 某组件的属性表（模糊匹配）
node scripts/query_components.mjs list               # 全部组件
node scripts/query_components.mjs cat 表单           # 某分类下的组件
node scripts/query_components.mjs search 表格        # 全字段搜索
```

## 常见问题与规则

通用规则（事件绑定、双向绑定 `model`、`occupier`、`className`、生命周期、参数传递）的精简表见 [SKILL.md](../SKILL.md)「Critical Rules / Troubleshooting」；完整 ❌/✅ 示例与 TS 接口见 [protocol.md](protocol.md)；条件渲染 / 循环渲染等模式见 [patterns.md](patterns.md)。本文件专注于各组件的 props/events 参考。
