# tiny-engine-renderer

## 简介

基于 Vue 3 的低代码渲染引擎。

## 用法

```javascript
// xxx.vue
import { h, reactive } from 'vue'
import Main from '@opentiny/tiny-engine-renderer'

export default {
  render() {
    // 页面schema
    const schema = reactive({})
    // 工具类
    const utils = reactive({})
    // 全局状态
    const globalState = reactive([])
    // 数据源
    const dataSourceMap = reactive({})

    schema.children.length ? h(Main, { schema, utils, globalState, dataSourceList }) : null
  }
}
```
