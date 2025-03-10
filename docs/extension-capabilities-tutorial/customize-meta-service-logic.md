# 定制元服务逻辑

默认的元服务功能可能不满足使用需求，我们提供了两种方式来定制元服务逻辑

## 使用 options 扩展

开发者设计元服务时，可以获取到外部传入 options 对象，并通过 options 中的一些参数来初始化服务，这就像是前端组件里面的 props

当然 options 可以填写哪些值取决于开发者设计元服务时支持哪些参数，具体需要查询需要扩展的元服务的文档

> 由于 tiny-engine 定义服务时会使用 `WeakMap` 来存储服务的对象，所以不能直接只用扩展运算符来扩展接口。可以新建一个用于扩展服务的文件直接在服务对象上进行修改

新创建一个用于扩展服务的文件，下面示例为 `myService.js`，然后直接修改服务的属性

```js
// myService.js
import { GlobalService } from '@opentiny/tiny-engine'

const MyGlobalService = GlobalService

GlobalService.options = {
  url: 'custom url'
}

export default { MyGlobalService }
```

重新导出服务后，我们去注册表文件导入并注册

```js
// registry.js
import {
  // ...
  GenerateCodeService,
  GlobalService
} from '@opentiny/tiny-engine'
import { MyGlobalService } from './myService'

export default {
  root: {
    id: 'engine.root',
    metas: [GenerateCodeService, MyGlobalService]
  }
  // ...
}
```

## 扩展元服务接口

新创建一个用于扩展服务的文件，下面示例为 `myService.js`，然后直接修改服务的属性。如果需要获取服务的 `state`，可以直接使用服务自带的 `getState` 接口

```js
// myService.js
import { GlobalService } from '@opentiny/tiny-engine'

const MyGlobalService = GlobalService

GlobalService.apis = {
  ...GlobalService.apis,
  getStateCopy: () => {
    console.log('我是扩展的元服务接口')
    const state = GlobalService.apis.getState()
    return state
  }
}

export default { MyGlobalService }
```

注册元服务和前面第一种方式一致

## 和其他元服务通信

如果你想和其他元服务进行通信，我们提供了一种发布订阅机制。扩展元服务的 `init` 方法，在 `init` 方法中订阅事件。在 `apis` 或者其他地方发布事件

```js
// myService.js
import { useMessage } from '@opentiny/tiny-engine-meta-register'
import { FooService, BarService } from '...'

const { subscribe, publish } = useMessage()

const CustomFooService = FooService
const CustomBarService = BarService

const originalInit = CustomFooService.init
CustomFooService.init = (context) => {
  originalInit(context)
  subscribe({
    topic: 'custom_event',
    callback: (data) => {
      // 回调逻辑
    }
  })
}

CustomBarService.apis = {
  ...CustomBarService.apis,
  publishEvent: () => {
    publish({ topic: 'custom_event', data: { foo: 'bar' } })
  }
}

export default { CustomFooService, CustomBarService }
```
