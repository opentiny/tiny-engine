# tiny-engine-renderer

## 简介

基于 Vue 3 的低代码渲染引擎。

## 用法

```javascript
// xxx.vue
import { h } from 'vue'
import Main, { api } from '@open/tiny-engine-renderer'

export default {
  render() {
    // 工具类
    api.setUtils(utils)
    // 全局状态
    api.setGlobalState(globalState)
    // 数据源
    api.setDataSourceMap(dataSourceList)
    // 页面schema
    api.setSchema(schema)

    return h(Main)
  }
}
```