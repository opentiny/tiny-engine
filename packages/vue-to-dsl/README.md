# @opentiny/tiny-engine-vue-to-dsl

> 将 Vue 代码文件/项目反向转换为 TinyEngine DSL Schema 的工具包

## 简介

`@opentiny/tiny-engine-vue-to-dsl` 解析 Vue 代码文件，生成可用于 TinyEngine 的 DSL Schema。同时内置“整包应用”转换能力，可从项目目录或 zip 包中聚合出 App 级 Schema（含 i18n、数据源、全局状态、页面元信息等）。

## 主要特性

- 支持模板、脚本（Options API / script setup）、样式的完整解析
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
import { VueToDslConverter } from '@opentiny/tiny-engine-vue-to-dsl';

const converter = new VueToDslConverter();
const vueCode = `
<template>
  <div class="hello">
    <h1>{{ state.title }}</h1>
    <button @click="handleClick">Click me</button>
  </div>
</template>
<script setup>
import { ref } from 'vue'
const state = vue.reactive({
  title: 'Hello TinyEngine'
})
function handleClick() { console.log('clicked') }
</script>
<style scoped>
.hello { color: red; font-size: 16px; }
</style>
`;

const result = await converter.convertFromString(vueCode, 'Hello.vue');
console.log(result.schema);
```

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
  materials?: any[] | Record<string, any>
  supportedComponents?: string[]
  preserveComments?: boolean
  strictMode?: boolean
  // 控制是否额外输出 computed 字段（默认 false）
  // 无论该开关是否开启，computed 都会同步转换为兼容当前设计器运行时的 state accessor
  computed_flag?: boolean
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

`materials`/`supportedComponents` 可用于在运行时把设计器当前已加载的物料组件注入给转换器，避免在 `vue-to-dsl` 包内直接依赖具体的 `builtin.json` 或 `bundle.json` 文件。

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

页面与区块生成规则：

- 单文件导入：默认按页面处理，生成 `Page` schema
- 整包导入时，`src/views/**/*.vue` 默认作为页面候选，进入 `pageSchema`
- 页面里 import 并在模板中实际使用到的本地 `.vue` 子组件，会沿 import 链递归转换为区块，进入 `blockSchemas`
- 如果某个被页面作为子组件使用的 `.vue` 文件本身位于 `src/views/` 下，则优先按区块处理，并从最终 `pageSchema` 中排除
- `src/components/**/*.vue` 不再无条件全部生成区块；只有被页面或其子组件沿 import 链实际引用到时，才会进入 `blockSchemas`
- 本地 `.vue` 区块的收集优先基于 import 链路解析真实文件，不再为“模板里引用但无法解析到真实文件”的场景自动补空占位区块

与导入工具栏（`packages/toolbars/upload`）联动时的行为：

- 项目目录导入与 zip 导入都会先调用本包聚合出 `appSchema`
- `pageSchema` 会被导入为页面；若存在重名页面，导入工具栏会先弹出覆盖确认，再决定是否创建/覆盖页面
- `blockSchemas` 会被导入为区块；同名区块会走更新并发布，非同名区块会走创建并发布
- 导入工具栏只会处理本包输出的 `pageSchema` / `blockSchemas` / `utils` / `dataSource` / `globalState` / `i18n` 等聚合结果，本包本身不负责页面落库、区块发布或覆盖交互

## 模板/脚本/样式支持

模板（`parseTemplate`）

- HTML 标签与自定义组件；通过 `componentMap` 做名称映射
- 指令：`v-if`/`v-for`/`v-show`/`v-model`/`v-on`/`v-bind`/`v-slot` 等核心指令
- v-for：尝试抽取迭代表达式，写入 `loop: { type: 'JSExpression', value: 'this.xxx' }`
- v-if / v-else-if / v-else：会转换为互斥的 `condition: { type: 'JSExpression', value }` 分支链条件
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
- computed 兼容：
  - 模板/脚本中对 computed 的引用会按 `this.state.xxx` 形式改写
  - 生成 schema 时会额外把 computed 映射为 state accessor，兼容当前设计器导入运行时
  - 当 `computed_flag=true` 时，仍会保留 `schema.computed` 字段，便于调试或后续处理

样式（`parseStyle` + 辅助）

- 基础样式串：直出 `css`
- 辅助能力：`parseCSSRules`、`extractCSSVariables`、`hasMediaQueries`、`extractMediaQueries`

## 输出 Schema 约定（页面级）

- 根节点 `componentName: 'Page'`，自动补齐 `id`（8 位字母数字）
- `state`/`methods`/`computed`/`lifecycle` 值以 `{ type: 'JSFunction', value: string }` 表达（state 中基础类型按需折叠）
- `computed` 会同步展开为 `state` 中的 accessor getter，以便导入后的页面在当前运行时下正常显示
- `children` 为模板树；属性中无法安全字面量化的表达式以 `JSExpression` 表达
- 所有字符串做轻度“去换行/多空格”规整

## 已知限制

- `v-for` 目前优先支持常见写法，如 `item in list`、`(item, index) in list`、`(item, index) of list`；更复杂的解构参数、对象枚举、三参数以上的场景支持有限
- `v-if / v-else-if / v-else` 会按同级相邻节点组成互斥分支链；如果模板经过复杂包装、注释穿插或非常规结构改写，分支链识别结果可能与原始意图不完全一致
- `v-show` 会转换为 `JSExpression`，但其显示/隐藏语义仍依赖运行时组件对对应属性的支持
- 本地 `.vue` 子组件转区块依赖 import 链路和模板实际使用情况；动态注册组件、运行时字符串组件名、非常规组件解析方式无法完整覆盖
- `src/router/index.js`、`src/stores/*.js`、`src/utils(.js|.ts|index)`、`src/lowcodeConfig/dataSource.json` 等应用级信息仍然主要基于约定路径和轻量解析，复杂工程结构或自定义目录布局可能需要额外适配
- `script setup` 与 Options API 的常见场景已覆盖，但宏展开、复杂 TS 类型推导、装饰器、非常规编译期语法等场景支持有限
- 变量中的 JSX / `h()` 渲染函数已支持常见 slot 场景，但非常复杂的 render 函数组合、深层闭包、运行时生成 vnode 的逻辑仍可能需要额外适配
- `computed` 已做导入兼容，会额外映射为 `state accessor`；如果原始 computed 强依赖运行时环境、副作用或复杂闭包，导入后仍建议重点校验

## 测试用例说明

测试目录位于 `test/`，包含：

- `test/sfc/`：单个 SFC 的基础转换测试
- `test/testcases/`：按用例目录组织的场景测试（新增用例放这里）
- `test/full/`：整包项目/zip 的端到端转换测试

在本包目录 `packages/vue-to-dsl` 下使用 Vitest 进行单元与集成测试，运行：

```bash
pnpm i
pnpm test
# 或
npx vitest run
```

运行后会将每个用例的结果写入 `output/schema.json`，便于比对。

用例结构（示例）：

```text
test/testcases/
  001_simple/
    input/component.vue     # 输入 SFC
    expected/schema.json    # 期望 Schema（可为“子集”）
    output/schema.json      # 测试生成（自动写入）
```

断言规则（见 `test/testcases/index.test.js`）：

- 忽略动态字段：递归忽略所有层级的 `meta` 与 `id`
- 子集匹配：实际输出只需“包含” expected 的结构和值（数组按 expected 长度顺序比对前 N 项）
- 若 expected 含 `error: true`：仅断言发生错误并允许 schema 存在部分内容

因此 expected 可仅保留关键片段，无需完全复制整个 schema，适合 children 很多的页面。

新增用例步骤：

1. 在 `test/testcases/` 新建目录（序号递增）
2. 添加 `input/component.vue`
3. 添加最小化 `expected/schema.json`（仅关键字段）
4. 运行测试，参考 `output/schema.json` 微调 expected

组件映射：

- 本测试文件内已设置常用 OpenTiny 组件映射（`tiny-form`、`tiny-grid`、`tiny-select`、`tiny-button-group`、`tiny-time-line` 等）
- 如使用未映射组件，可在测试中补充 `componentMap`，或在用例中用已映射组件替代
