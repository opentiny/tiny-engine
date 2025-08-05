# 注册表（新）

⚠️注意：该文档仅适用于 TinyEngine v2.7+ 版本，如果需要了解旧的注册表配置方式，请参考 [旧注册表](./registry.md)。

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
import { META_APP } from '@opentiny/tiny-engine'
// 注册表配置示例
const register = {
  'engine.root': {
    id: 'engine.root',
    metas: [GenerateCodeService, GlobalService]
  },
  'engine.config': engineConfig,
  // 覆盖官方的配置
  [META_APP.Layout]: {
    options: {...}
  },
  // 配置 false 隐藏工具栏清空按钮，并且在构建的时候，会将工具栏插件的相关代码做 tree-shaking
  [META_APP.Clean]: false,
  // 替换整个页面JS插件，手动配置 tree-shaking 为 true，会将原来的页面JS插件的代码做 tree-shaking
  /* #__TINY_ENGINE_TREE_SHAKING__: true */
  [META_APP.Script]: scriptPlugin,
  // 新增的插件，需要使用与官方插件不相同的唯一 id
  'engine.plugins.customPlugin': {
    ...customPlugin,
    id: 'engine.plugins.customPlugin'
  }
}
```

示例解读：
1. 最外层为一个对象结构，每个键都是一个唯一的注册表ID。
2. `engine.root`：配置核心的元服务，许多的插件依赖这些核心的元服务。
3. `engine.config`：低代码引擎的配置，主要配置物料、主题等等。
4. `[META_APP.Layout]`：配置低代码引擎的布局，可以通过扩展官方布局来自定义。
5. `[META_APP.Clean]: false`：通过设置为 `false` 来隐藏特定工具栏按钮，同时在构建时会进行 tree-shaking 优化。
6. `[META_APP.Script]`：替换整个页面JS插件，并通过注释 `#__TINY_ENGINE_TREE_SHAKING__: true` 指示构建工具对原插件代码进行 tree-shaking。
7. `engine.plugins.customPlugin`：添加新的自定义插件，需要使用与官方插件不同的唯一ID。

通过这种基于ID的注册方式，可以更精细地控制平台的各个部分，实现添加、替换或移除特定功能，而不需要重新配置整个注册表结构。


注意⚠️：v2.7 开始，如果对原插件没有改动（配置、替换、删除），则不需要在注册表中进行声明，因为官方内置了全量的注册表：

官方默认的全局注册表，请参考 [默认注册表](https://github.com/opentiny/tiny-engine/blob/develop/packages/design-core/registry.js)。

## 注册表使用

### 初始化时传入注册表

我们可以在初始化的时候传入注册表，初始化的时候会合并默认的注册表和传入的注册表，然后生成新的注册表。并根据注册表的配置，完成低代码平台的定制化。

1. 在 registry.js 中声明注册表

```javascript
// registry.js
import scriptPlugin from './src/plugins/script'

export default {
  [META_SERVICE.Http]: HttpService,
  'engine.config': {
    ...engineConfig
  },
  // 删除工具栏清空按钮
  [META_APP.Clean]: false,
  // 替换整个页面JS插件
  [META_APP.Script]: scriptPlugin,
  // 传入插件配置
  [META_APP.Layout]: {
    options: {
      relativeLayoutConfig: {
        // ...
      }
    }
  }
}
```

2. 调用 init 方法传入注册表，初始化TinyEngine

```javascript
async function startApp() {
  const registry = await import('../registry')
  const { init } = await import('@opentiny/tiny-engine')

  init({
    // 传入注册表
    registry: [registry.default],
    // 配置器
    configurators,
    // 其他配置项
    createAppSignal: ['global_service_init_finish']
  })
}

// 初始化 TinyEngine
startApp()
```


### 运行时使用注册表

在 TinyEngine 启动起来之后，我们可以通过注册表提供的能力，获取到元服务、元应用、配置，并进行事件订阅、插件之间的通信等等。

#### 获取元服务或元应用

```javascript
import { getMergeMeta, getMetaApi } from '@opentiny/tiny-engine'

export default {
  setup() {
    // 获取物料面板插件
    const materialsPlugin = getMergeMeta('engine.plugins.materials')
    
    // 获取物料面板插件的入口组件
    const materialsEntry = materialsPlugin?.entry
    
    // 获取全局服务的 API
    const globalServiceApi = getMetaApi('engine.service.globalService')
    
    // 获取生成代码服务的 API
    const generateCodeApi = getMetaApi('engine.service.generateCode')
    
    // 获取页面JS插件
    const pageControllerPlugin = getMergeMeta('engine.plugins.pagecontroller')
  }
}
```

#### 获取配置

```javascript
import { getMergeMeta, getOptions } from '@opentiny/tiny-engine'

export default {
  setup() {
    // 获取引擎配置
    const engineConfig = getMergeMeta('engine.config')
    
    // 获取特定配置项
    const platformId = engineConfig?.platformId
    const materials = engineConfig?.materials
    const editMode = engineConfig?.editMode
    
    // 获取布局配置选项
    const layoutOptions = getOptions('engine.layout')
    
    // 或者通过 getMergeMeta 获取布局配置
    const layoutConfig = getMergeMeta('engine.layout')?.options
    
    return {
      platformId,
      materials,
      editMode,
      layoutOptions,
      layoutConfig
    }
  }
}
```

#### 事件订阅与发布

```javascript
import { useMessage, getMetaApi } from '@opentiny/tiny-engine'

export default {
  setup() {
    // 获取消息订阅发布系统
    const { subscribe, publish, unsubscribe } = useMessage()
    
    // 订阅事件
    subscribe({
      topic: 'schemaChange',
      subscriber: 'custom-plugin',
      callback: (data) => {
        console.log('schema 发生了变化', data)
      }
    })
    
    // 发布事件
    const notifyPageSaved = () => {
      publish({
        topic: 'schemaChange',
        data: { 
          operation: {...}
        }
      })
    }
    
    // 组件销毁时取消订阅
    onUnmounted(() => {
      unsubscribe({
        topic: 'schemaChange',
        subscriber: 'custom-plugin'
      })
    })
    
    // 获取全局服务也可以使用事件机制
    const globalService = getMetaApi('engine.service.globalService')
    if (globalService?.getBaseInfo) {
      globalService.getBaseInfo().then((data) => {
        console.log('全局应用信息', data)
      })
    }
    
    return {
      notifyPageSaved
    }
  }
}
```

#### 使用内置Hook API

TinyEngine提供了许多内置的Hook API，可以更便捷地访问各种官方的元应用元服务：

```javascript
import { 
  useCanvas, 
  usePage, 
  useLayout, 
  useProperties,
  useMaterial
} from '@opentiny/tiny-engine'

export default {
  setup() {
    // 使用schema服务相关 API
    const canvas = useCanvas()
    
    // 使用页面相关API
    const page = usePage()
    
    // 使用布局相关API
    const layout = useLayout()
    
    // 使用属性面板相关API
    const properties = useProperties()
    
    // 使用物料相关API
    const material = useMaterial()
    
    const toggleSidePanel = (panelName) => {
      layout.activePlugin(panelName)
    }

    // 详细的插件 API，请参考各个元服务的 API 文档
  }
}
```

通过以上示例，可以看到注册表提供了一种统一的方式来获取和操作低代码平台中的各种服务和插件，实现了解耦和灵活的通信机制。这使得开发者可以更容易地扩展和定制 TinyEngine 平台，而不需要深入了解底层实现细节。

更多高级特性，请参考 [注册表高级配置](./new-registry-advanced.md)。


## Vite 配置要求

**重要说明⚠️**：为了使注册表的 tree-shaking 功能正常工作，您需要在 `vite.config.js` 中配置 `registryPath` 参数，指向您的注册表文件路径。

```javascript
// vite.config.js
import { defineConfig, mergeConfig } from 'vite'
import { useTinyEngineBaseConfig } from '@opentiny/tiny-engine-vite-config'

export default defineConfig((configEnv) => {
  const baseConfig = useTinyEngineBaseConfig({
    viteConfigEnv: configEnv,
    root: __dirname,
    // 其他配置...
    registryPath: './registry.js'  // 必须配置，指向注册表文件路径
  })
  
  const customConfig = {
    // 您的自定义配置...
  }

  return mergeConfig(baseConfig, customConfig)
})
```

### 为什么需要配置 registryPath？

1. **Tree-shaking 优化**：TinyEngine 需要在构建时解析注册表文件，识别哪些插件被设置为 `false`，从而在构建时移除相关代码，减小最终打包体积。

2. **注释指令解析**：支持解析注册表中的特殊注释（如 `#__TINY_ENGINE_TREE_SHAKING__: true`），实现更精细的代码优化。

3. **构建优化**：通过静态分析注册表配置，在构建时就确定最终需要包含的功能模块，提高运行时性能。

如果没有配置 `registryPath`，以下功能可能无法正常工作：
- 插件的 tree-shaking 优化
- 通过设置 `false` 来移除插件的功能
- 构建时的代码体积优化
