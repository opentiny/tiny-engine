# 注册表

⚠️注意：TinyEngine v2.7 版本之后，注册表的方式有所变化，请参考 [新注册表](./new-registry.md) 了解新的注册表配置方式。

## 什么是注册表

在 新架构介绍中，我们引入了注册表的概念，二次低代码平台开发用户通过注册表配置元服务元应用，TinyEngine底层引擎读取注册表的配置，完成元应用元服务的定制，然后加载对应的元应用元服务，完成低代码平台的启动。

所以注册表就是完成元应用元服务注册、配置、覆盖的TinyEngine提供的底层核心功能。

注册表的作用：

- 接收元应用元服务的配置，传递到低代码底层引擎，完成低代码平台的定制化。
- 合并默认的元应用元服务的配置项以及用户的自定义配置项。
- 提供查询能力，使得元服务与元服务之间能够相互通信，或者相关状态变量。

## 注册表配置结构

传入到TinyEngine底层引擎的示例：

```javascript
// 注册表配置示例
const register = {
  root: {
    id: 'engine.root',
    metas: [GenerateCodeService, GlobalService]
  },
  config: engineConfig,
  layout: {
    ...Layout
    options: {...}
  },
  themes: [
    {
      id: 'engine.theme.light'
    },
    {
      id: 'engine.theme.dark'
    }
  ],
  toolbars: [Media, Save],
  plugins: [Materials, Tree],
  settings: [Props, Styles],
  Canvas: Canvas
}
```

示例解读：

1. 最外层为一个对象结构。
2. root: 配置核心的元服务，许多的插件依赖这些核心的元服务。
3. config: 低代码引擎的配置，主要配置物料、主题等等。
4. layout：配置低代码引擎的布局。
5. theme: 传入主题插件，然后可以通过 config 进行选择这些插件。
6. toolbars: 传入顶部工具栏的插件以及配置。
7. plugins: 传入左侧列表的插件，以及配置。
8. settings： 传入右侧设置面板的插件以及配置。
9. Canvas：画布插件的配置。

## 注册表使用

### 注册表注册

```javascript
import { defineEntry } from '@opentiny/tiny-engine'

const registry = {
  root: {
    id: 'engine.root',
    metas: [GenerateCodeService, GlobalService]
  },
  config: engineConfig,
  layout: {
    ...Layout
    options: {...}
  },
  themes: [
    {
      id: 'engine.theme.light'
    },
    {
      id: 'engine.theme.dark'
    }
  ],
  toolbars: [Media, Save],
  plugins: [Materials, Tree],
  settings: [Props, Styles],
  Canvas: Canvas
}

defineEntry(registry)
```

### 通过注册表获取元服务、元应用、配置

```vue
<script setup>
import { getMergeMeta } from '@opentiny/tiny-engine-meta-register'

// 获取配置
const platformId = getMergeMeta('engine.config')?.platformId

// 获取元应用元服务
const materialsPanel = getMergeMeta('engine.plugins.materials')?.entry
</script>
```

### 通过注册表传入配置、定制覆盖项

```javascript
const register = {
  
  layout: {
    ...Layout
    // 传输配置项
    options: {...}
  },
  toolbars: [
    // 第二个对象传入配置、覆盖项
    [Media, { ... }]
  ],
  // 传入自定义插件
  plugins: [Materials, Tree, customPlugin],
}
```

## engine.config 配置项详解

engine.config 是注册表中的重要配置项，它控制着低代码引擎的核心行为。

engine.config 配置示例：

```javascript
const registry = {
  config: {
    id: 'engine.config',
    theme: 'light',
    material: ['/mock/bundle.json'],
  }
}
```

以下是 engine.config 中关键配置项的详细说明：

### material 配置

material 配置用于指定物料资源的来源，它接受一个数组，每个元素表示一个物料资源的 URL 路径, 也可以是 JSON 对象。
注：JSON 对象的格式需要符合 TinyEngine 的物料格式。直接配置 JSON 对象的形式 v2.5+ 版本开始支持。

```javascript
import bundle from './bundle.json'
// engine.config.js 示例
export default {
  // 可以传入 url 路径
  material: ['/mock/bundle.json'],
  // 也可以传入 JSON 对象
  material: [bundle],
  // 也可以传入多个物料源
  material: ['/mock/bundle.json', bundle],
  // ...
}
```

- 物料资源通常是 JSON 格式的文件，包含了组件的元数据信息
- 支持配置多个物料源，引擎会按照顺序加载这些物料
- 如果多个物料源中存在同名组件，后加载的会覆盖先加载的

### theme 配置

theme 配置用于指定低代码平台的主题，它接受一个字符串值，对应注册表中 themes 数组里定义的主题 type。

```javascript
// engine.config.js 示例
export default {
  // ...
  theme: 'light', // 或 'dark'，对应 themes 数组中的主题 type
  // ...
}
```

主题的定义示例：

```javascript
const registry = {
  // ...
  // 默认的 theme 配置
  themes: [
    {
      id: 'engine.theme.light',
      text: '浅色主题',
      type: 'light',
      icon: 'light',
      oppositeTheme: 'dark'
    },
    {
      id: 'engine.theme.dark',
      text: '深色主题',
      type: 'dark',
      icon: 'dark',
      oppositeTheme: 'light'
    }
  ],
  // ...
}
```

- theme 的值需要与注册表中 themes 数组里某个主题的 type 相匹配
- 主题切换可以通过修改此配置项的值来实现
- 主题会影响整个低代码平台的视觉样式
