# @opentiny/tiny-engine-vue-to-dsl

> 将Vue SFC文件反向转换为TinyEngine DSL Schema的工具包

## 📖 简介

`@opentiny/tiny-engine-vue-to-dsl` 是一个专门用于将Vue单文件组件（SFC）反向转换为TinyEngine DSL Schema的工具包。它能够解析Vue的模板、脚本和样式，并生成对应的DSL结构，便于在低代码平台中使用。

## ✨ 特性

- 🔄 **双向转换**: 支持Vue SFC到DSL Schema的反向转换
- 🎯 **完整解析**: 支持模板、脚本（Options API & Composition API）、样式的完整解析
- 🛠️ **可配置**: 提供丰富的配置选项，支持自定义解析器
- 📦 **类型安全**: 完整的TypeScript类型定义
- 🧪 **测试覆盖**: 完善的单元测试覆盖
- ⚡ **高性能**: 基于官方Vue编译器，解析性能优异

## 🚀 安装

```bash
npm install @opentiny/tiny-engine-vue-to-dsl
```

## 📋 使用

### 基础用法

```javascript
import { VueToDslConverter } from '@opentiny/tiny-engine-vue-to-dsl'

const converter = new VueToDslConverter()

// 从字符串转换
const vueCode = `
<template>
  <div class="hello">
    <h1>{{ title }}</h1>
    <button @click="handleClick">Click me</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const title = ref('Hello World')

function handleClick() {
  console.log('Button clicked')
}
</script>

<style scoped>
.hello {
  color: red;
  font-size: 16px;
}
</style>
`

const result = await converter.convertFromString(vueCode)

if (result.schema) {
  console.log('转换成功:', result.schema)
} else {
  console.error('转换失败:', result.errors)
}
```

### 从文件转换

```javascript
// 从文件转换
const result = await converter.convertFromFile('./components/MyComponent.vue')
```

### 批量转换

```javascript
// 批量转换多个文件
const results = await converter.convertMultipleFiles([
  './components/Page1.vue',
  './components/Page2.vue',
  './components/Page3.vue'
])
```

### 自定义配置

```javascript
const converter = new VueToDslConverter({
  // 组件映射配置
  componentMap: {
    'div': 'TinyDiv',
    'button': 'TinyButton',
    'input': 'TinyInput'
  },
  
  // 是否保留注释
  preserveComments: true,
  
  // 是否严格模式
  strictMode: false,
  
  // 自定义解析器
  customParsers: {
    template: customTemplateParser,
    script: customScriptParser,
    style: customStyleParser
  }
})
```

## 🔧 API

### VueToDslConverter

主要的转换器类，提供Vue SFC到DSL Schema的转换功能。

#### 构造函数

```typescript
constructor(options?: VueToSchemaOptions)
```

#### 方法

- `convertFromString(vueCode: string): Promise<ConvertResult>` - 从字符串转换
- `convertFromFile(filePath: string): Promise<ConvertResult>` - 从文件转换
- `convertMultipleFiles(filePaths: string[]): Promise<ConvertResult[]>` - 批量转换

### 工具函数

- `parseVueFile(filePath: string)` - 解析Vue文件
- `parseSFC(vueCode: string)` - 解析SFC字符串
- `generateSchema(template, script, style, options)` - 生成DSL Schema
- `parseTemplate(template: string)` - 解析模板
- `parseScript(script: string)` - 解析脚本
- `parseStyle(style: string)` - 解析样式

## 📝 类型定义

```typescript
interface VueToSchemaOptions {
  componentMap?: Record<string, string>
  preserveComments?: boolean
  strictMode?: boolean
  customParsers?: {
    template?: TemplateParser
    script?: ScriptParser
    style?: StyleParser
  }
}

interface ConvertResult {
  schema: PageSchema | null
  dependencies: string[]
  errors: string[]
  warnings: string[]
}

interface PageSchema {
  componentName: 'Page'
  fileName: string
  path: string
  meta?: Record<string, any>
  state?: Record<string, any>
  methods?: Record<string, any>
  computed?: Record<string, any>
  lifecycle?: Record<string, any>
  props?: PropInfo[]
  css?: string
  children?: TemplateSchema[]
}
```

## 🎯 支持的Vue特性

### 模板特性
- ✅ 基础HTML标签
- ✅ Vue组件
- ✅ 指令（v-if, v-for, v-show, v-model等）
- ✅ 事件绑定（@click, @input等）
- ✅ 属性绑定（:prop, :class等）
- ✅ 插槽（slot）
- ✅ 插值表达式（{{ }}）

### 脚本特性
- ✅ Composition API（script setup）
- ✅ Options API（data, methods, computed等）
- ✅ 响应式API（ref, reactive, computed）
- ✅ 生命周期钩子
- ✅ Props定义
- ✅ Emits定义
- ✅ Import语句解析

### 样式特性
- ✅ 普通CSS
- ✅ Scoped样式
- ✅ CSS预处理器（scss, less等）
- ✅ CSS变量
- ✅ 媒体查询

## 🧪 测试

```bash
# 运行测试
npm test

# 运行测试并生成覆盖率报告
npm run coverage

# 运行单元测试
npm run test:unit
```

## 📁 项目结构

```
src/
├── converter.js          # 主转换器类
├── parser/               # SFC解析器
│   └── index.js
├── parsers/              # 各部分解析器
│   ├── templateParser.js # 模板解析器
│   ├── scriptParser.js   # 脚本解析器
│   ├── styleParser.js    # 样式解析器
│   └── index.js
├── generator/            # Schema生成器
│   └── index.js
├── types/                # 类型定义
│   └── index.js
└── index.js              # 主入口文件
```

## 🤝 贡献

欢迎贡献代码！请查看 [CONTRIBUTING.md](../../CONTRIBUTING.md) 了解贡献指南。

## 📄 许可证

[MIT](../../LICENSE)

## 🔗 相关链接

- [TinyEngine](https://opentiny.design/tiny-engine)
- [Vue.js](https://vuejs.org/)
- [Vue Compiler](https://github.com/vuejs/core/tree/main/packages/compiler-sfc)

## 🐛 问题反馈

如果您在使用过程中遇到问题，请通过以下方式反馈：

- [GitHub Issues](https://github.com/opentiny/tiny-engine/issues)
- [官方社区](https://opentiny.design/tiny-engine)

## 📈 更新日志

查看 [CHANGELOG.md](./CHANGELOG.md) 了解版本更新信息。
