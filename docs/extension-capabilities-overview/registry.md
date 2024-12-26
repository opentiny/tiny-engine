# 注册表

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
