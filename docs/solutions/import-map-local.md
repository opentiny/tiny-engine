# CDN 依赖本地化方案

## 概述

TinyEngine 在画布和预览都使用了 import-map 的方式来加载依赖，例如 `vue`、`vue-i18n` 以及物料等，这些 import-map 默认会依赖于 npmmirror 的 CDN 服务。
然而，在一些企业场景中，由于可用性和稳定性要求，无法依赖外部的 CDN服务。

当前可以采取的方案有：
- 搭建企业私有网络的 unpkg 服务。
- 使用本文档介绍的CDN依赖本地化方案

CDN依赖本地化的核心思想是：在构建过程中，将 TinyEngine 所需的远程CDN资源替换为构建产物中的本地文件。其主要优点包括：

1. 减少对外部CDN的依赖，提高应用的可靠性
2. 支持离线环境或内网环境中对 import-map 所需资源的访问。
3. 加快资源加载速度，提升应用性能。

## 使用方法

### 启用 CDN 依赖本地化

请按照以下步骤操作启用 CDN 依赖本地化功能：

1. **修改环境变量**

在 `.env.alpha`、`.env.production` 文件中添加以下配置

```bash
# 启用 CDN 依赖本地化功能
VITE_LOCAL_IMPORT_MAPS=true

# 启用物料的资源本地化功能。注意⚠️：这里需要您的物料package需要能够通过 npm 的方式进行下载，否则会失效。
VITE_LOCAL_BUNDLE_DEPS=true

# 定义本地化资源存放目录，默认为 local-cdn-static
VITE_LOCAL_IMPORT_PATH=local-cdn-static
```

2. 【可选】 在 `vite.config.js` 中传入自定义配置

可通过 importMapLocalConfig 选项配置导入映射规则和文件复制行为：

```javascript
const baseConfig = useTinyEngineBaseConfig({
  importMapLocalConfig: {
    importMap: { imports: { ... } },
    copy: { ... }
  }
  // ...otherConfig
})
```

### 配置选项

CDN 本地化接受以下配置选项：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| importMapLocalConfig | Object | `{ importMap: { imports: {} }, copy: {} }` | 本地CDN配置对象 |
| importMapLocalConfig.importMap | Object | `{ imports: {} }` | 导入映射配置，定义需要本地化的CDN依赖 |
| importMapLocalConfig.copy | Object | `{}` | 自定义复制配置，可以覆盖特定包的默认配置 |

#### 导入映射（importMap） 详细说明

`importMapLocalConfig.importMap` 是一个包含 `imports` 属性的对象，它定义了需要本地化的CDN依赖。在插件内部，它会与默认的导入映射配置合并。

importMap 的格式示例：
```json
{
  "imports": {
    "vue": "${VITE_CDN_DOMAIN}/vue${versionDelimiter}3.2.37${fileDelimiter}/dist/vue.runtime.esm-browser.js",
    "vue-router": "${VITE_CDN_DOMAIN}/vue-router${versionDelimiter}4.1.5${fileDelimiter}/dist/vue-router.global.js",
    "pinia": "${VITE_CDN_DOMAIN}/pinia${versionDelimiter}2.0.23${fileDelimiter}/dist/pinia.iife.prod.js"
  }
}
```

URL格式说明：
- `${VITE_CDN_DOMAIN}` - CDN域名占位符，将被替换为本地路径
- `${versionDelimiter}` - 版本分隔符，用于分隔包名和版本
- `${fileDelimiter}` - 文件路径分隔符，用于分隔版本和文件路径

例如：
unpkg 的 cdn 链接为：`https://unpkg.com/vue@3.5.13/dist/vue.runtime.esm-browser.js`。
那么我们根据这个地址，可以拆分成以下几个部分：
- `https://unpkg.com` CDN 服务域名，即 `VITE_CDN_DOMAIN`
- `vue` 依赖的名称（packageName）
- `@` 包名与版本号的分隔符  `versionDelimiter`
- `3.5.13` 版本号
- `/dist/vue.runtime.global.prod.js` 具体依赖的文件路径

如果是 npmmirror CDN 服务，则链接为：`https://registry.npmmirror.com/vue/3.5.13/files/dist/vue.runtime.esm-browser.js`。
我们可以拆分成以下几个部分：
- `https://registry.npmmirror.com` CDN 服务域名。即 `VITE_CDN_DOMAIN`
- `vue` 依赖的名称 （packageName）
- `/` 包名与版本的分隔符 `versionDelimiter`
- `3.5.13` 版本号
- `/files` 版本号与具体文件路径的分隔符，即 `${fileDelimiter}`
- `/dist/vue.runtime.global.prod.js` 具体依赖的文件路径

假如我们希望依赖 vue 的 3.5+ 版本，那么我们就可以传入约定的 importMap 配置：

```json
{
  "imports": {
    "vue": "${VITE_CDN_DOMAIN}/vue${versionDelimiter}^3.5${fileDelimiter}/dist/vue.runtime.esm-browser.js"
  }
}
```

传入配置之后，插件将解析这些URL，提取包名、版本和文件路径，然后在构建时将它们替换为本地路径。
即：`./local-cdn-static/vue@^3.5/dist/vue.runtime.esm-browser.js`

**重要说明**：如果您在 Vite 配置中传递了 `importMapLocalConfig.importMap`，还需要在 registry 注册表的 config 中传入同样的配置，以确保应用在运行时能正确读取自定义的 importMap 配置。例如：

```javascript
// 在注册表配置中
{
  config: {
    id: 'engine.config',
    importMap: importMapLocalConfig.importMap,
    // ... 其他配置
  }
}
```

这是因为画布和页面预览默认会从注册表 `getMergeMeta('engine.config')?.importMap` 中读取自定义的映射配置，如果获取失败，则会读取默认的映射。

#### 文件复制配置 copy 说明【可选】

`importMapLocalConfig.copy` 可自定义特定包的文件复制配置。 默认配置如下

```javascript
{
  '@opentiny/vue-theme': {
    filePathInPackage: '/'
  },
  '@opentiny/vue-renderless': {
    filePathInPackage: '/'
  },
  '@opentiny/vue-runtime': {
    filePathInPackage: '/dist3/'
  },
  '@vue/devtools-api': {
    filePathInPackage: '/'
  }
}
```

配置支持以下选项：
- `filePathInPackage`: 指定要复制的包内路径，如果想要复制整个包，则配置为 `'/'`
- `version`: (可选) 覆盖包的版本号（注意：只影响下载的版本号，不影响实际请求 URL 的版本号）

例如，自定义配置：
```javascript
{
  'vue': {
    filePathInPackage: '/dist/'
  },
  'element-plus': {
    filePathInPackage: '/dist/index.css',
    version: '2.2.0'
  }
}
```

### 处理bundle文件中的CDN链接

如果需要处理bundle文件中的CDN链接，可以在 `.env.xxx` 文件中配置 `VITE_LOCAL_BUNDLE_DEPS=true`：

注意⚠️：物料文件 bundle.json 中 packages 数组中，只有前缀与 env 文件配置的 `VITE_CDN_DOMAIN` 一致，才会被复制打包并改写 bundle.json。

比如有如下物料配置和 .env 配置

1. **`bundle.json`**:
```json
{
  "packages": [
    {
      "name": "TinyVue组件库",
      "package": "@opentiny/vue",
      "version": "3.20.0",
      "destructuring": true,
      "script": "https://npmmirror.com/@opentiny/vue-runtime/~3.20/files/dist3/tiny-vue-pc.mjs",
      "css": "https://npmmirror.com/@opentiny/vue-theme/~3.20/files/index.css"
    },
    {
      "name": "element-plus组件库",
      "package": "element-plus",
      "version": "2.4.2",
      "script": "https://unpkg.com/element-plus@2.4.2/dist/index.full.mjs",
      "css": "https://unpkg.com/element-plus@2.4.2/dist/index.css"
    }
  ]
}
```

2. **`.env.alpha`**:

```bash
VITE_CDN_DOMAIN=https://unpkg.com
```

此时，只有前缀匹配的 `element-plus` 才会被解析并复制 npm 内容。而 `@opentiny/vue-runtime` 则不会被复制


## 实现原理

本地化CDN依赖可以分为以下几个核心步骤：

### 1. 分析导入映射并收集依赖

`importMapLocalPlugin`会分析提供的`importMapLocalConfig`和默认的导入映射，识别所有需要本地化的CDN依赖。这个过程包括：

- 解析CDN URL获取包名、版本和文件路径
- 合并用户配置和默认配置
- 生成文件复制任务列表

### 2. 判断和安装依赖包

插件会检查所需的依赖包是否已在本地存在，对于不存在或版本不匹配的包，会通过`installPackageTemporary`函数临时安装到指定目录。

### 3. 复制并转换文件

对于已识别的CDN依赖，插件会：

- 复制所需文件到目标CDN目录
- 对JavaScript文件进行路径替换转换 (比如： `import push from './push'` 需要改成 `import push from './push.js'`)
- 保持目录结构与原始CDN一致

### 4. 处理Bundle文件

`copyBundleDeps`功能专门处理bundle文件中的CDN链接：

- 提取bundle文件中的CDN链接
- 替换为本地路径
- 生成新的bundle文件

## 注意事项

1. 本地化CDN会增加构建输出的大小，但会提高应用的可靠性和性能
2. 某些特定格式的CDN URL可能需要在`copy`中进行特别配置
3. 使用本地化 CDN 之后，需要确保 .mjs 后缀文件资源的响应头 content-type 为 `application/javascript`，否则会导致无法正常加载。
