# 注册表（新）

⚠️注意：该文档仅适用于 TinyEngine v2.6+ 版本，如果需要了解旧的注册表配置方式，请参考 [旧注册表](./registry.md)。

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
  'engine.root': {
    id: 'engine.root',
    metas: [GenerateCodeService, GlobalService]
  },
  'engine.config': engineConfig,
  // 覆盖官方的配置
  'engine.layout': {
    ...Layout
    options: {...}
  },
  // 配置 false 隐藏工具栏清空按钮，并且在构建的时候，会将工具栏插件的相关代码做 tree-shaking
  'engine.toolbars.clean': false,
  // 替换整个页面JS插件，手动配置 tree-shaking 为 true，会将原来的页面JS插件的代码做 tree-shaking
  /* #__TINY_ENGINE_TREE_SHAKING__: true */
  'engine.plugins.pagecontroller': scriptPlugin,
  // 使用跟官方的插件不相同的唯一 id，代表新增的插件
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
4. `engine.layout`：配置低代码引擎的布局，可以通过扩展官方布局来自定义。
5. `engine.toolbars.clean: false`：通过设置为 `false` 来隐藏特定工具栏按钮，同时在构建时会进行 tree-shaking 优化。
6. `engine.plugins.pagecontroller`：替换整个页面JS插件，并通过注释 `#__TINY_ENGINE_TREE_SHAKING__: true` 指示构建工具对原插件代码进行 tree-shaking。
7. `engine.plugins.customPlugin`：添加新的自定义插件，需要使用与官方插件不同的唯一ID。

通过这种基于ID的注册方式，可以更精细地控制平台的各个部分，实现添加、替换或移除特定功能，而不需要重新配置整个注册表结构。


注意⚠️：v2.6 开始，如果对原插件没有改动（配置、替换、删除），则不需要在注册表中进行声明，因为官方内置了全量的注册表：

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
  'engine.toolbars.clean': false,
  // 替换整个页面JS插件
  'engine.plugins.pagecontroller': scriptPlugin,
  // 传入插件配置
  'engine.layout': {
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

### 注册表 hotfix 功能，实现紧急 bug 修复功能

背景：开源的开发过程中，难免会遇到一些紧急的 bug 需要修复，如果等待开源版本的下个版本发布，可能需要经过这样一个流程：

1. 用户向TinyEngine团队反馈 bug。（30min - 1h）
2. TinyEngine团队分析 bug 原因，并给出修复方案。（1h - 2h）
3. 验证修复方案，发布新版本。（1h）
4. 用户同步新版本，验证新版本。（1h-2h）
5. 用户确认无误，提交审批流程给领导，发布新版本。（1h-2h）
6. 新版本上线，用户可以正常使用。（1h-2h）

经过上述的一个流程可以看到，整个标准的修复流程相对比较长，如果是一些对用户影响比较大的问题，在商业上可能无法满足要求。

因此，我们推出了注册表的 hotfix 功能，可以通过传入 hotfix 的注册表，对某些插件实现函数级别的覆盖能力，从而实现快速修复紧急 bug。

#### hotfix 注册表功能使用示例：

1. 在后端增加一个接口，返回临时的 hotfix 注册表。比如 `/hotfix-registry.js`。没有紧急 bug 的时候，返回空对象。

2. 在 TinyEngine 初始化的时候，调用这个接口，获取临时的 hotfix 注册表。

```javascript
// 这里获取线上的注册表
const fetchHotfixRegistry = async (url) => {
  const response = await import(/* @vite-ignore */ url)
  return response.default
}

async function startApp() {
  // 调用 initHotfixRegistry 方法，传入接口地址以及请求方法，获取临时的 hotfix 注册表并提前注册。
  const hotfixRegistry =
    (await initHotfixRegistry({
      url: 'http://localhost:8090/hotfixRegistry.js',
      request: fetchHotfixRegistry
    })) || {}

  const registry = await import('../registry')
  const { init } = await import('@opentiny/tiny-engine')

  init({
    // 合并多个注册表
    registry: [registry.default, hotfixRegistry],
    configurators,
    createAppSignal: ['global_service_init_finish']
  })
}

startApp()
```

示例 hotfix 注册表：

```javascript
// hotfixRegistry.js
export default {
  'engine.plugins.i18n': {
    overwrite: {
      methods: {
        '': {
          // 覆盖 i18n 插件的 openEditor 方法
          openEditor: (ctx) => (_event, row) => {
            const { isEditMode, editingRow, i18nTable, langList, getActiveRow, utils } = ctx()
            isEditMode.value = Boolean(row.key)
            editingRow.value = row
            if (!isEditMode.value) {
              row.key = `custom.${utils.guid()}`
              langList.value.unshift(row)
            }
            i18nTable.value.setActiveRow(row).then(() => {
              getActiveRow()
            })
          }
        }
      },
      lifeCycles: {
        '': {
          onMounted: [
            // 覆盖 i18n 插件的 onMounted 方法
            (ctx) => () => {
              const { i18nSearchTypes, currentSearchType } = ctx()
              console.log('overWrite i18n onMounted', i18nSearchTypes, currentSearchType.value)
              currentSearchType.value = i18nSearchTypes[0].value
            }
          ]
        }
      }
    }
  },
  'engine.plugins.bridge': {
    overwrite: {
      templates: {
        // 覆盖 utils 插件的 BridgeManage 模板
        BridgeManage: `<template>
  <h1
        v-for="(item, index) in list"
        :key="item.name"
        @click.stop="openEdit(item, index)"
      >
        <div class="item-label">{{ item.name }}</div>
  </h1>
</template>
`
      }
    }
  }
}
```

#### 注册表 hotfix 功能说明

##### 注册表的 hotfix 功能，需要提前注册，因为 overWrite 的逻辑需要提前读取。

即 initHotfixRegistry 方法的调用，必须在 registry 以及 init 方法之前。（所以 注册表 以及 init 方法都需要改成异步的 import）

```javascript
async function startApp() {
  
  const hotfixRegistry =
    (await initHotfixRegistry({
      url: 'http://localhost:8090/hotfixRegistry.js',
      request: fetchHotfixRegistry
    })) || {}

  const registry = await import('../registry')
  const { init } = await import('@opentiny/tiny-engine')

  init({
    // 合并多个注册表
    registry: [registry.default, hotfixRegistry],
    configurators,
    createAppSignal: ['global_service_init_finish']
  })
}
```

##### hotfix 注册表的覆盖能力

1. 覆盖插件的 methods 方法（自定义方法）
2. 覆盖插件的 lifeCycles 方法（vue 生命周期）
3. 覆盖插件的 templates 模板（覆盖 vue 模板）

#### hotfix 注册表覆盖示例

##### 覆盖插件的 methods 方法

##### 覆盖插件的 lifeCycles 方法

##### 覆盖插件的 templates 模板

#### hotfix 注册表注意事项

1. ⚠️ 该功能应该仅作为紧急 bug 修复使用，不应该滥用，一旦官方已经修复 bug，请及时移除 hotfix 注册表。

现在，让我们再来看看使用了 hotfix 注册表之后的修复流程：

1. 二开用户向TinyEngine团队反馈 bug。（30min - 1h）
2. TinyEngine 分析 bug 原因，并给出修复方案。（1h - 2h）
3. 二开用户使用 hotfix 注册表功能，覆盖官方的某个函数或者是模板。（10min）
4. 用户验证修复方案，推送到生产环境注册表。（1h）
5. 生产环境生效，用户正常使用。

可以看到，使用 hotfix 注册表之后，修复流程大大缩短，大大提高了修复效率。
