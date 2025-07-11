# 页面预览相关配置项

## 在页面预览入口添加物料配置

> **⚠️ Breaking Change (v2.6)**  
> 在 v2.6 版本中，我们对页面预览配置进行了破坏性调整，现在需要在物料入口 `preview.js` 中直接配置物料信息，不再通过 URL 参数传递物料相关的 script 和 css 资源。

### 基本配置

在 `preview.js` 文件中，需要在注册表的 `engine.config` 配置中添加 `material` 属性：

```javascript
import { initPreview, META_SERVICE, HttpService } from '@opentiny/tiny-engine'

// 其他配置...

const registry = {
  [META_SERVICE.Http]: HttpService,
  'engine.config': {
    id: 'engine.config',
    theme: 'light',
    // 新增：物料配置
    material: ['/mock/bundle.json']
  }
}

initPreview({
  registry
})
```

### 配置说明

- `material`：物料包配置数组，支持配置多个物料包
- 每个物料包可以是一个 JSON 文件路径，包含物料的元数据、组件定义、样式等信息
- 物料包的资源（script、css）会根据配置自动加载，无需在 URL 中传递

### 多物料包配置示例

```javascript
const registry = {
  [META_SERVICE.Http]: HttpService,
  'engine.config': {
    id: 'engine.config',
    theme: 'light',
    // 配置多个物料包
    material: [
      '/mock/bundle.json',           // 基础物料包
      '/custom/business-bundle.json', // 业务物料包
      '/third-party/ui-bundle.json'   // 第三方物料包
    ]
  }
}
```

### 迁移指南

如果您从 v2.5 或更早版本升级到 v2.6，请按以下步骤进行迁移：

1. 在 `preview.js` 的 `engine.config` 中添加 `material` 配置
2. 确保物料包 JSON 文件路径正确且可访问

## 配置预览页面的跳转 url

默认跳转逻辑（不配置）： 
- dev 本地开发：跳转到 preview.html。比如跳转到: `http://localhost:8090/preview.html?...`
- 生产环境：跳转到 /preview，比如跳转到： `https://opentiny.design/preview?...`

如果二次开发平台想要跳转到不同的路由，则可以进行配置：

### 直接配置 url

适用场景：仅修改跳转 url，不修改 query 查询字符串部分，比如：

<pre>
<code>
import { Preview } from '@opentiny/tiny-engine'
export default {
   toolbars: [
     [Preview, { options: { ...Preview.options,  previewUrl:  import.meta<wbr>.env.MODE.includes('prod') ? 'http://tiny-engine-preview.com/customPreview' : '' } }]
   ]
}
</code>
</pre>

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
