# tiny-engine-renderer

## Introduction

A Vue3 renderer for tiny-engine.

## Usage

```javascript
// xxx.vue
import { h } from 'vue'
import Main, { api } from '@open/tiny-engine-renderer'

export default {
  render() {
    // utils
    api.setUtils(utils)
    // globalState
    api.setGlobalState(globalState)
    // dataSource
    api.setDataSourceMap(dataSourceList)
    // schema
    api.setSchema(schema)

    return h(Main)
  }
}
```

