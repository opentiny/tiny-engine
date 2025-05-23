# 注册表 API

注册表 API 是 TinyEngine 的核心功能模块，提供了元应用、元服务的注册、管理、查询和通信能力。本文档详细介绍所有可用的 API 接口。

## 核心注册表 API

### getMergeMeta

根据 ID 获取合并后的元应用或元服务配置。

```javascript
import { getMergeMeta } from '@opentiny/tiny-engine'

// 获取特定元应用
const layoutPlugin = getMergeMeta('engine.layout')
const materialsPlugin = getMergeMeta('engine.plugins.materials')
// 获取自己自定义的插件
const customPlugin = getMergeMeta('engine.customPlugin')
```

**参数：**
- `id`: 元应用或元服务的唯一标识符

**返回值：**
- 元应用或元服务的完整配置对象，如果不存在则返回 `undefined`

### getMetaApi

获取元应用或元服务提供的 API 接口。

```javascript
import { getMetaApi } from '@opentiny/tiny-engine'

// 获取完整 API 对象
const globalServiceApi = getMetaApi('engine.service.globalService')

// 获取特定 API 方法
const getPageList = getMetaApi('engine.service.globalService', 'getPageList')
```

**参数：**
- `id`: 元应用或元服务的 ID
- `key` (可选): 特定 API 方法名

**返回值：**
- 当不提供 `key` 时，返回完整的 API 对象
- 当提供 `key` 时，返回对应的 API 方法
- 如果不存在则返回 `undefined`

### getOptions

获取元应用或元服务的配置选项。

```javascript
import { getOptions } from '@opentiny/tiny-engine'

// 获取布局配置选项
const layoutOptions = getOptions('engine.layout')
```

**参数：**
- `id`: 元应用或元服务的 ID

**返回值：**
- 配置选项对象，如果不存在则返回 `undefined`

### getMergeMetaByType

根据类型获取所有对应的元应用或元服务。

```javascript
import { getMergeMetaByType } from '@opentiny/tiny-engine'

// 获取所有插件
const services = getMergeMetaByType('plugins')
```

**参数：**
- `type`: 元应用或元服务的类型

**返回值：**
- 匹配类型的元应用或元服务数组

### getAllMergeMeta

获取所有已注册的元应用和元服务。

```javascript
import { getAllMergeMeta } from '@opentiny/tiny-engine'

// 获取所有注册的元应用和元服务
const allMetas = getAllMergeMeta()
```

**返回值：**
- 所有已注册元应用和元服务的数组

## 消息通信 API

### useMessage

提供事件订阅和发布机制，实现组件间通信。

```javascript
import { useMessage } from '@opentiny/tiny-engine'

export default {
  setup() {
    const { subscribe, publish, unsubscribe, broadcast } = useMessage()
    
    // 订阅消息
    const subscription = subscribe({
      topic: 'schemaChange',
      subscriber: 'my-plugin',
      callback: (data) => {
        console.log('Schema changed:', data)
      }
    })
    
    // 发布消息
    const handleSave = () => {
      publish({
        topic: 'schemaChange',
        data: { operation: 'save', timestamp: Date.now() }
      })
    }
    
    // 广播消息（会存储为最后一条消息）
    const handleBroadcast = () => {
      broadcast({
        topic: 'globalUpdate',
        data: { type: 'system', message: 'System updated' }
      })
    }
    
    // 取消订阅
    onUnmounted(() => {
      unsubscribe(subscription)
      // 或者
      unsubscribe({ topic: 'schemaChange', subscriber: 'my-plugin' })
    })
    
    return {
      handleSave,
      handleBroadcast
    }
  }
}
```

**API 方法：**

#### subscribe

订阅消息。

**参数：**
- `options.topic`: 消息主题
- `options.subscriber` (可选): 订阅者标识
- `options.callback`: 消息回调函数

**返回值：**
- 订阅信息对象 `{ topic, subscriber }`

#### publish

发布消息到指定主题的所有订阅者。

**参数：**
- `options.topic`: 消息主题
- `options.data`: 消息数据

#### broadcast

广播消息，与 `publish` 类似，但会存储为最后一条消息，新的订阅者会自动收到。

**参数：**
- `options.topic`: 消息主题
- `options.data`: 消息数据

#### unsubscribe

取消消息订阅。

**参数：**
- `options.topic`: 消息主题
- `options.subscriber` (可选): 订阅者标识，不传递 subscriber时，会取消所有订阅

## 服务定义 API

### defineService

定义一个新的元服务。

```javascript
import { defineService } from '@opentiny/tiny-engine'

const MyService = defineService({
  id: 'engine.service.myService',
  type: 'MetaService',
  initialState: {
    count: 0,
    items: []
  },
  options: {
    enableCache: true
  },
  init: ({ state, options }) => {
    // 服务初始化逻辑
    console.log('Service initialized with options:', options)
  },
  apis: {
    increment: (amount = 1) => {
      const currentState = MyService.apis.getState()
      MyService.apis.setState({ count: currentState.count + amount })
    },
    getItems: () => {
      return MyService.apis.getState().items
    },
    addItem: (item) => {
      const currentState = MyService.apis.getState()
      MyService.apis.setState({ 
        items: [...currentState.items, item] 
      })
    }
  }
})
```

**参数：**
- `serviceOptions.id`: 服务唯一标识
- `serviceOptions.type`: 必须为 'MetaService'
- `serviceOptions.initialState`: 初始状态对象
- `serviceOptions.options`: 服务配置选项
- `serviceOptions.init`: 初始化函数
- `serviceOptions.apis`: API 方法定义（对象或函数）

**返回值：**
- 服务对象，包含 `id`、`type`、`options` 和 `apis` 属性

**内置 API：**
- `getState()`: 获取当前状态（只读）
- `setState(kv)`: 更新状态
- `setOptions(kv)`: 更新配置选项

## 配置器 API

### addConfigurator

添加属性配置器组件。

```javascript
import { addConfigurator } from '@opentiny/tiny-engine'
import InputConfigurator from './InputConfigurator.vue'
import SelectConfigurator from './SelectConfigurator.vue'

addConfigurator([
  {
    name: 'InputConfigurator',
    component: InputConfigurator
  },
  {
    name: 'SelectConfigurator', 
    component: SelectConfigurator
  }
])
```

**参数：**
- `components`: 配置器组件数组，每个元素包含 `name` 和 `component`

### getConfigurator

获取指定名称的配置器组件。

```javascript
import { getConfigurator } from '@opentiny/tiny-engine'

const InputConfigurator = getConfigurator('InputConfigurator')
```

**参数：**
- `name`: 配置器名称

**返回值：**
- 配置器组件，如果不存在则返回 `undefined`

## 高级功能 API

### initHotfixRegistry

获取并初始化热修复注册表。

```javascript
import { initHotfixRegistry } from '@opentiny/tiny-engine-meta-register'

// 从远程 URL 加载热修复注册表
await initHotfixRegistry({
  url: 'https://example.com/hotfix-registry.js'
})
```

**参数：**
- `options.url`: 热修复注册表文件的 URL
- `options.request` (可选): 自定义请求函数

## 常量定义

### META_SERVICE

定义了所有内置元服务的 ID 常量。

```javascript
import { META_SERVICE } from '@opentiny/tiny-engine'

console.log(META_SERVICE.GlobalService) // 'engine.service.globalService'
console.log(META_SERVICE.Layout)        // 'engine.service.layout'
// ... 更多服务常量
```

### META_APP

定义了所有内置元应用的 ID 常量。

```javascript
import { META_APP } from '@opentiny/tiny-engine'

console.log(META_APP.Layout)     // 'engine.layout'
console.log(META_APP.Materials)  // 'engine.plugins.materials'
console.log(META_APP.Canvas)     // 'engine.canvas'
// ... 更多应用常量
```
