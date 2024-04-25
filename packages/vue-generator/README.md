# @opentiny/tiny-engine-dsl-vue

> 将 schema 转换成具体的，可读性高，可维护的代码


TODO:

- [ ] 架构支持配置出码
- [ ] 抽取通用底层能力，支持用户自定义插件，自定义出码结果
- [ ] 官方提供更多内置出码方案

## 安装

```bash
npm install @opentiny/tiny-engine-dsl-vue
```

## 使用

### 使用官方默认配置出码

```javascript
import { generateApp } from '@opentiny/tiny-engine-dsl-vue'

const instance = generateApp()

const res = await instance.generate(appSchema)
```

### 传入配置

```javascript
import { generateApp } from '@opentiny/tiny-engine-dsl-vue'

const instance = generateApp({
  pluginConfig: {
    // 对 formatCode 插件传入自定义配置
    formatCode: {
      singleQuote: false,
      printWidth: 180,
      semi: true
    }
  }
})

const res = await instance.generate(appSchema)
```

### 使用自定义插件替换官方插件

```javascript
import { generateApp } from '@opentiny/tiny-engine-dsl-vue'

const customDataSourcePlugin = () => {
  return {
    name: '',
    description: '',
    run: () {
      // ... 自定义出码逻辑
    }
  }
}

const instance = generateApp({
  customPlugins: {
    // 使用自定义插件替换官方 dataSource 生成的插件
    dataSource: customDataSourcePlugin()
  }
})

const res = await instance.generate(appSchema)
```

## API

### generateApp

该函数返回出码实例

使用：

```typescript
function generateApp(config: IConfig): CodeGenInstance
```

config 传参配置：

```typescript
interface IConfig {
  // 插件配置，会传入对应的官方插件配置里面
  pluginConfig: {
    template: ITemplatePluginConfig;
    block: IBlockPluginConfig;
    page: IPagePluginConfig;
    dataSource: IDataSourcePluginConfig;
    dependencies: IDependenciesPluginConfig;
    globalState: IGlobalStatePluginConfig;
    i18n: II18nPluginConfig;
    router: IRouterPluginConfig;
    utils: IUtilsPluginConfig;
    formatCode: IFormatCodePluginConfig;
    parseSchema: IParseSchemaPluginConfig;
  };
  // 自定义插件，可以替换官方插件，或者增加额外的插件
  customPlugins: {
    template: IPluginFunction;
    block: IPluginFunction;
    page: IPluginFunction;
    dataSource: IPluginFunction;
    dependencies: IPluginFunction;
    i18n: IPluginFunction;
    router: IPluginFunction;
    utils: IPluginFunction;
    formatCode: IPluginFunction;
    parseSchema: IPluginFunction;
    globalState: IPluginFunction;
    // 解析类的插件
    transformStart: Array<IPluginFunction>;
    // 转换 schema 转换的插件
    transform: Array<IPluginFunction>;
    // 处理出码后的插件
    transformEnd: Array<IPluginFunction>;
  };
  // 额外的上下文，可以在插件运行的时候获取到
  customContext: Record<string, any>
}
```

### codeGenInstance 相关方法

#### generate
生成源码方法，传入 appSchema，异步返回生成的文件列表

```javascript
async function generate(schema: IAppSchema): Promise<Array<IFileItem>>
```

传参&返回类型定义

```typescript
interface FolderItem {
  componentName: string;
  folderName: string
  id: string;
  parentId: string;
  router: string;
}

interface SchemaChildrenItem {
  children: Array<SchemaChildrenItem>;
  componentName: string;
  id: string;
  props: Record<string, any>;
}

interface PageOrBlockSchema {
  componentName: string;
  css: string;
  fileName: string;
  lifeCycles: Record<string, Record<string, { type: "JSFunction"; value: string; }>>;
  methods: Record<string, { type: "JSFunction"; value: string; }>;
  props: Record<string, any>;
  state: Array<Record<string, any>>;
  meta: { id: Number, isHome: Boolean, parentId: String, rootElement: String, route: String };
  children: Array.<SchemaChildrenItem>
  schema?: { properties: Array<Object.<String, any>>, events: Object.<String> };
}

interface ComponentMapItem {
  componentName: string;
  destructuring: boolean;
  exportName?: string;
  package?: string;
  main?:  string;
  version: string;
}

interface IAppSchema {
  i18n: {
    en_US: Record<string, any>;
    zh_CN: Record<string, any>
  };
  utils: Array<{ name: string; type: 'npm' | 'function'; content: { type?: "JSExpression" | "JSFunction"; value?: string };  }>;
  dataSource: {
    dataHandler?: { type: "JSFunction"; value: string; };
    errorHandler?:{ type: "JSFunction"; value: string; };
    willFetch?: { type: "JSFunction"; value: string; };
    list: Array<{ id: Number; name: String; data: Object }>;
  };
  globalState: Array<{
    id: string; state: Record<string, any>;
    actions: Record<string, { type: "JSFunction", value: String }>;
    getters: Record<string, { type: "JSFunction", value: String }>;
  }>;
  // 页面 schema
  pageSchema: Array<PageOrBlockSchema | FolderItem>;
  // 区块 schema
  blockSchema: Array<PageOrBlockSchema>;
  // 组件对应 package map
  componentsMap: Array<ComponentMapItem>;
  // 设计器 meta 信息
  meta: {
    // 该应用 ID
    name: string;
    // 该应用描述
    description: string;
  };
}
```

### 官方内置 plugin API

#### genBlockPlugin  生成区块代码

```typescript
interface Config {
  blockBasePath: String; // 区块生成文件所在的目录，默认值：'./src/component'
  sfcConfig: ISFCConfig; // 生成 sfc 风格的 vue 文件的配置，详见下面 sfc 插件
}
```

#### genDataSourcePlugin 生成数据源代码

```typescript
interface IConfig {
  path: string; // 生成数据源的路径，默认值：./src/lowcodeConfig
}
```

#### genGlobalState 生成全局 state

```typescript
interface IConfig {
  path: string; // 生成全局 state 所在的目录，默认值 ./src/stores
}
```

#### genI18nPlugin 生成国际化相关文件

```typescript
interface IConfig {
  localeFileName: string; // locale 文件名，默认值 locale.js
  entryFileName: string; // 入口文件名，默认值 index.js
  path: string; // 生成 i18n 所在的目录
}
```

#### genPagePlugin 生成页面 vue 文件

```typescript
interface IConfig {
  pageBasePath: string; // 页面生成文件所在目录
}
```

#### genRouterPlugin 生成路由相关文件

```typescript
interface IConfig {
  fileName: string; // 路由文件名，默认值： index.js
  path: string; // 生成路由文件所在文件夹 默认值：./src/router
}
```

#### genTemplatePlugin

```typescript
interface IConfig {
  template: string | () => Array<IFile> // 可指定出码模板，或自定义生成出码模板函数
}
```

#### genUtilsPlugin

```typescript
interface IConfig {
  fileName: string; // 生成工具类的文件名，默认值：utils.js
  path: string; // 生成工具类所在的目录 ./src
}
```

#### formatCodePlugin 格式化代码

```javascript
// prettier 配置
{
 singleQuote: true,
  printWidth: 120,
  semi: false,
  trailingComma: 'none' 
}
```

#### genSFCWithDefaultPlugin & generateSFCFile

官方生成 sfc 风格的 .vue 文件，提供了 hook 插槽，可以对生成的.vue 文件做细微调整

- genSFCWithDefaultPlugin  带有官方 hooks 的生成 .vue 文件方法
- generateSFCFile  无官方 hooks 的生成 .vue 文件方法

##### 使用示例

**处理自定义 props**

```javascript
// 自定义插件处理 TinyGrid 中的 editor 配置
const customPropsHook = (schemaData, globalHooks) => {
  const { componentName, props } = schemaData.schema

  // 处理 TinyGrid 插槽
  if (componentName !== 'TinyGrid' || !Array.isArray(props?.columns)) {
    return
  }

  props.columns.forEach((item) => {
    if (!item.editor?.component?.startsWith?.('Tiny')) {
      return
    }

    const name = item.editor?.component

    globalHooks.addImport('@opentiny/vue', {
      destructuring: true,
      exportName: name.slice(4),
      componentName: name,
      package: '@opentiny/vue'
    })

    item.editor.component = {
      type: 'JSExpression',
      value: name
    }
  })
}

// 使用
genSFCWithDefaultPlugin(schema, componentsMap, {
  genTemplate: [customPropsHook]
})
```



## 如何编写自定义插件

如果官方配置不满足自定义出码的需求，我们还支持自定义出码插件。

### 替换官方出码插件

官方提供了以下几个官方的出码插件：

- template 生成静态出码模板
- block  生成区块代码
- page  生成页面代码
- dataSource 生成数据源相关代码
- dependencies 将组件依赖的 package 注入到 package.json 中
- i18n 生成 i18n 国际化数据
- router 生成路由文件
- utils 生成 utils 工具类文件
- formatCode 格式化已经生成的文件
- parseSchema 解析、预处理 schema
- globalState 生成全局状态文件

我们可以通过传入配置的方式替换掉官方的插件：

```javascript
generateApp({
  customPlugins: {
    template: customPluginItem // 传入自定义插件，替换官方插件
  }
})
```

### 增加增量插件

如果是对官方 schema 做了增量的协议，需要增加对应的插件，我们也支持增加 `transformStart`、`transform`、`transformEnd` 几个生命周期钩子

```javascript
generateApp({
  customPlugins: {
    // 解析阶段的自定义插件
    transformStart: [customPlugin1],
    // 转换 schema，出码的自定义插件
    transform: [customPlugin2],
    // 结束阶段的自定义插件
    transformEnd: [customPlugin3]
  }
})
```

### 插件相关约定

为了能够让 CodeGenInstance 实例能够调用用户传入的自定义插件，我们需要做相关的约定：

- 提供 run 函数，该不能是箭头函数，否则无法绑定相关上下文
- 函数名遵守 tinyEngine-generateCode-plugin-xxx 的规则
- 提供 options 进行配置并且有默认 options

比如：

```javascript
function customPlugin(options) {
  const runtimeOptions = merge(defaultOptions, options)

  return {
    name: 'tinyEngine-generateCode-plugin-demo',
    description: 'demo',
    run(schema, context) {
      console.log('here is a demo plugin')
    }
  }
}
```

run 函数传参说明：

- schema 即为 generate 函数中传入的 appSchema
- context codeInstance 提供的上下文，包括：
  - config 当前 instance 的配置
  - genResult 当前出码的文件数组
  - genLogs 当前出码的日志
  - ...customContext 用户在 generateApp 实例化函数中自定义传入的上下文

#### 插件提供的上下文

codeGenInstance 提供了一些相关的上下文，丰富了插件的拓展能力。

相关的上下文
- this.addLog(log): void 向 genLogs 中增加一条日志 
- this.addFile(fileItem: FileItem, override: boolean): boolean  向 genResult 中增加一个文件
- this.getFile(path, fileName) 根据 path 和 fileName 在 genResult 中寻找目标文件
- this.replaceFile(fileItem) 替换文件


## 设计思想&原理

### 出码模块架构
TODO: 待补充

### 出码的本质&核心目标

出码的本质：是将在画布中可编排的协议，存储的 schema 信息，转换成我们在程序员可以看懂可维护的高质量代码。

目标：

- 一套 schema 协议（可增量拓展），支持多框架出码，比如 react、vue2.x、vue3.x、 Angular
- 支持用户自定义出码，具体为
  - 支持自定义出码模板
  - 支持自定义部分文件的出码（生成 jsx 风格、生成 setup 风格等等）


### 整体生成代码的流程

- `const instance = generateApp(config)` 传入配置得到出码实例
- `instance.generate(appSchema)` 调用generate 方法，传入 appSchema，得到应用的代码文件

其中， generate 函数生成代码文件的过程：

- validate 校验传入 appSchema 的合法性
- transformStart 运行 transformStart 阶段的插件，该阶段的插件建议用户预处理 schema，不实际生成代码文件
- transform      运行 transform 阶段的插件，该阶段主要将 schema 转换为目标代码文件（页面、区块、数据源、国际化、全局状态、静态模板文件、等等）
- transformEnd   运行 transformEnd 阶段的插件，该阶段建议用户处理已经生成的文件，比如代码格式化、校验生成的代码文件存在的冲突等等

### 生成页面代码的整体流程与设计

生成代码的过程中，主要的核心是处理可编排的页面 schema，生成页面或者区块文件，所以我们在这里展开讲讲官方的插件实现与思考。


