# @opentiny/tiny-engine-vue-to-dsl

> 将 Vue 代码文件/项目反向转换为 TinyEngine DSL Schema 的工具包

## 简介

`@opentiny/tiny-engine-vue-to-dsl` 解析 Vue 代码文件，生成可用于 TinyEngine 的 DSL Schema；同时内置“整包应用”转换能力，可从项目目录或 zip 包中聚合出 App 级 Schema（含 i18n、数据源、全局状态、页面元信息等）。

## 主要特性

- 支持模板、脚本（Options API / script setup）、样式的完整解析
- 提供 CLI：一条命令把 .vue 转为 Schema
- 从 Vue 工程目录或 zip 文件生成 AppSchema
- 可配置组件映射、可插拔自定义解析器
- TypeScript 实现，导出完整类型；提供单元与集成测试

## 安装

```bash
pnpm add @opentiny/tiny-engine-vue-to-dsl
```

## 目录结构

```text
src/
├─ converter.ts        # 主转换器（含 app 级聚合与 zip 支持）
├─ generator/          # schema 生成与归一
├─ parser/             # SFC 粗分（template/script/style 块）
├─ parsers/            # 各块解析实现
├─ constants.ts        # 组件映射与组件包清单
├─ index.ts            # 包导出入口
└─ types/              # 类型导出
```

## 快速开始

```ts
import { VueToDslConverter } from '@opentiny/tiny-engine-vue-to-dsl'

const converter = new VueToDslConverter()
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
function handleClick() { console.log('clicked') }
</script>
<style scoped>
.hello { color: red; font-size: 16px; }
</style>
`

const result = await converter.convertFromString(vueCode, 'Hello.vue')
console.log(result.schema)
```

## 测试

使用 Vitest 进行单元与集成测试，运行：

```bash
pnpm install
pnpm test
# 或
npx vitest run
```

## CLI 使用

方式一：作为已安装包使用

```bash
tiny-vue-to-dsl <vue-file-path> [--output <path>] [--format json|js]

# 示例
tiny-vue-to-dsl ./components/MyComponent.vue
tiny-vue-to-dsl ./components/MyComponent.vue -o ./out/schema.json
tiny-vue-to-dsl ./components/MyComponent.vue -f js -o ./out/schema.js
```

方式二：在本仓库本地运行（先构建后执行）

```bash
# 在仓库根目录安装依赖并构建当前包
pnpm i
pnpm --filter @opentiny/tiny-engine-vue-to-dsl run build

# 执行构建产物（CJS）
node packages/vue-to-dsl/dist/cli.cjs path/to/Component.vue \
  --output out/schema.json \
  --format json
```

参数：

- --output/-o：输出文件路径（默认：同名 -schema.json）
- --format/-f：输出 json 或 js（默认 json；js 以 ES 模块导出 schema）

提示：可使用 `--help` 查看帮助；CLI 执行后会打印基础统计（状态/方法/计算属性/生命周期/子节点数量等）。

## API 概览

入口：`src/index.ts`

导出：

- `VueToDslConverter` 主转换器
- 解析工具：`parseVueFile`、`parseSFC`
- 生成器：`generateSchema`、`generateAppSchema`
- 细分解析器：`parseTemplate`、`parseScript`、`parseStyle`
- 类型与常量：`types/*`、默认组件映射 `defaultComponentMap`、默认组件包清单 `defaultComponentsMap`

### VueToDslConverter

```ts
new VueToDslConverter(options?: VueToSchemaOptions)

interface VueToSchemaOptions {
  componentMap?: Record<string, string>
  preserveComments?: boolean
  strictMode?: boolean
  customParsers?: {
    template?: { parse: (code: string) => any }
    script?: { parse: (code: string) => any }
    style?: { parse: (code: string) => any }
  }
  fileName?: string
  path?: string
  title?: string
  description?: string
}

type ConvertResult = {
  schema: any | null
  dependencies: string[]
  errors: string[]
  warnings: string[]
}
```

实例方法：

- `convertFromString(code, fileName?)`：从字符串转换
- `convertFromFile(filePath)`：从文件转换
- `convertMultipleFiles(filePaths)`：批量转换
- `convertAppDirectory(appDir)`：从工程目录（约定 src/ 结构）生成 App 级 schema
- `convertAppFromZip(zipBuffer)`：从 zip Buffer 生成 App 级 schema（Node 与浏览器均可用）
- `setOptions(partial)` / `getOptions()`：运行期更新/读取配置

### App 级聚合产物（convertAppDirectory/convertAppFromZip）

输出结构（概要）：

```ts
{
  meta: { name, description, generatedAt, generator },
  i18n: { en_US: {}, zh_CN: {} },
  utils: Array<{
    name: string,
    type: 'npm' | 'function',
    content: { type: 'JSFunction', value: string, package?: string, destructuring?: boolean, exportName?: string }
  }>,
  dataSource: { list: any[] },
  globalState: Array<{ id: string, state: Record<string, any> }>,
  pageSchema: any[],
  componentsMap: typeof defaultComponentsMap
}
```

数据来源约定：

- 页面：`src/views/**/*.vue`
- i18n：`src/i18n/en_US.json`、`src/i18n/zh_CN.json`
- 工具函数：`src/utils.js`（简单 import/export 分析，支持命名/默认导入导出）
- 数据源：`src/lowcodeConfig/dataSource.json`
- 全局状态：`src/stores/*.js`（简易 Pinia `defineStore` 解析，只提取 state 返回对象）
- 路由：`src/router/index.js`（提取 name/path 与 import 的页面文件，设置 `meta.router/isPage/isHome`）

## 模板/脚本/样式支持

模板（`parseTemplate`）

- HTML 标签与自定义组件；通过 `componentMap` 做名称映射
- 指令：`v-if`/`v-for`/`v-show`/`v-model`/`v-on`/`v-bind`/`v-slot` 等核心指令
- v-for：尝试抽取迭代表达式，写入 `loop: { type: 'JSExpression', value: 'this.xxx' }`
- 事件与绑定：能解析简单字面量，复杂表达式以 `JSExpression` 形式保留
- 文本与插值：转为 `Text` 组件；插值为 `JSExpression`
- 特殊：`tiny-icon-*` 归一为通用 `Icon` 组件并写入 `name` 属性

脚本（`parseScript`）

- script setup：
  - `reactive`/`ref` 识别到 state；`computed` 识别到 computed
  - 顶层函数与返回对象内成员识别到 methods
  - onMounted/onUpdated... 等生命周期识别
- Options API：
  - `props`（数组语法）/`methods`/`computed`/生命周期基础支持
- import 收集：用于返回 `dependencies`

样式（`parseStyle` + 辅助）

- 基础样式串：直出 `css`
- 辅助能力：`parseCSSRules`、`extractCSSVariables`、`hasMediaQueries`、`extractMediaQueries`

## 输出 Schema 约定（页面级）

- 根节点 `componentName: 'Page'`，自动补齐 `id`（8 位字母数字）
- `state`/`methods`/`computed`/`lifecycle` 值以 `{ type: 'JSFunction', value: string }` 表达（state 中基础类型按需折叠）
- `children` 为模板树；属性中无法安全字面量化的表达式以 `JSExpression` 表达
- 所有字符串做轻度“去换行/多空格”规整
