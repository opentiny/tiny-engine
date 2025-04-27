# 页面预览相关配置项


## 配置预览页面的跳转 url

默认跳转逻辑（不配置）： 
- dev 本地开发：跳转到 preview.html。比如跳转到: `http://localhost:8090/preview.html?...`
- 生产环境：跳转到 /preview，比如跳转到： `https://opentiny.design/preview?...`

如果二次开发平台想要跳转到不同的路由，则可以进行配置：

### 直接配置 url

适用场景：仅修改跳转 url，不修改 query 查询字符串部分，比如：

```javascript
import { Preview } from '@opentiny/tiny-engine'
export default {
   toolbars: [
     [Preview, { options: { ...Preview.options,  previewUrl:  import.meta.env.MODE.includes('prod') ? 'http://tiny-engine-preview.com/customPreview' : '' } }]
   ]
}
```

配置完成之后，在生产环境，TinyEngine 会增加必要的 query部分，然后跳转到配置的 url，比如：`http://tiny-engine-preview.com/customPreview?tenant=1&id=1&...`。

### 使用配置函数

适用场景：需要增加自定义修改 query。可定制性高

例如：
```javascript
import { Preview } from '@opentiny/tiny-engine'
export default {
   toolbars: [
     [
       Preview,
       {
          options: { 
              ...Preview.options,
              previewUrl: (originUrl, query) => {
                // 这里我们增加了自定义的 query： `test=1`
                return `http://tiny-engine-preview.com/customPreview?test=1&${query}`
             }
          }
       }
    ]
   ]
}
```

## 热更新可配置开关

我们在 v2.5 版本中增加预览页面自动刷新的支持，如果您的业务中不需要预览页面自动刷新的热更新功能，可以在注册表中配置 `previewHotReload` 关掉：

```javascript
// preview.js

initPreview({
  registry: {
    config: { id: 'engine.config', theme: 'light', previewHotReload: false },
    // ... other config
  }
})
```
