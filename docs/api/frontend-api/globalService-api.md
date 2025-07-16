# GlobalService 元服务

## 全局服务

默认的全局服务是 defaultGlobalService，它提供了一些常用的功能，例如：

- 获取当前应用信息
- 更新URL参数

## options 配置项

### enableTitleUpdate

作用：是否开启标题更新

类型：boolean

默认值：true

描述：defaultGlobalService 会读取 app 信息，根据 app 的信息配置网页的标题为：`${app.name} —— TinyEngine 前端可视化设计器`

如果需要自定义标题，可以设置为 false。然后通过 document.title 来设置标题

配置示例：

```javascript
import { GlobalService } from '@opentiny/tiny-engine'

export default {
  root: {
    id: 'engine.root',
    metas: [
      HttpService,
      GenerateCodeService,
      { ...GlobalService, options: { ...GlobalService.options, enableTitleUpdate: false } },
      ThemeSwitchService
    ]
  },
  //...
}
```

## api

### getBaseInfo

作用：获取当前应用信息

### postLocationHistoryChanged

发布 locationHistoryChanged 事件。通知 locationHistoryChanged 事件的订阅者，当前页面发生了变化。

### updateParams

作用：支持批量更新URL参数（pageId, blockId, previewId）

参数：
- `params: object` - 要更新的参数对象，可包含pageId、blockId、previewId属性
- `replace: boolean = false` - 是否替换当前历史记录，默认为false（添加新记录）

说明：
- pageId和blockId互斥，如果同时提供，会优先使用pageId并删除blockId
- 只有发生变化的参数才会被更新
- 更新后会发布`locationHistoryChanged`事件

使用示例：
```js
// 导入全局服务
import { getMetaApi, META_SERVICE } from '@opentiny/tiny-engine'

// 更新pageId和previewId
getMetaApi(META_SERVICE.GlobalService).updateParams({ 
  pageId: 'page123', 
  previewId: 'preview456' 
})

// 替换当前历史记录
getMetaApi(META_SERVICE.GlobalService).updateParams({ 
  blockId: 'block789' 
}, true)
```

### updatePageId

作用：更新URL中的pageId参数

参数：
- `pageId: string` - 页面ID

说明：
- 更新pageId会自动删除blockId（两者互斥）
- 会通过history.pushState更新URL，添加新的历史记录
- 更新后会发布`locationHistoryChanged`事件通知订阅者

使用示例：
```js
import { getMetaApi, META_SERVICE } from '@opentiny/tiny-engine'

// 更新到新页面
getMetaApi(META_SERVICE.GlobalService).updatePageId('page123')
```

### updateBlockId

作用：更新URL中的blockId参数

参数：
- `blockId: string` - 区块ID

说明：
- 更新blockId会自动删除pageId（两者互斥）
- 会通过history.pushState更新URL，添加新的历史记录
- 更新后会发布`locationHistoryChanged`事件通知订阅者

使用示例：
```js
import { getMetaApi, META_SERVICE } from '@opentiny/tiny-engine'

// 更新到新区块
getMetaApi(META_SERVICE.GlobalService).updateBlockId('block789')
```

### updatePreviewId

作用：更新URL中的previewId参数

参数：
- `previewId: string` - 预览ID
- `replace: boolean = false` - 是否替换当前历史记录，默认为false（添加新记录）

说明：
- 如果previewId为空，则会从URL中删除previewid参数
- 根据replace参数决定使用pushState还是replaceState更新URL
- 更新后会发布`locationHistoryChanged`事件通知订阅者

使用示例：
```js
import { getMetaApi, META_SERVICE } from '@opentiny/tiny-engine'

// 添加预览ID并创建新历史记录
getMetaApi(META_SERVICE.GlobalService).updatePreviewId('preview456')

// 更新预览ID并替换当前历史记录
getMetaApi(META_SERVICE.GlobalService).updatePreviewId('preview789', true)

// 删除预览ID
getMetaApi(META_SERVICE.GlobalService).updatePreviewId('')
```  
