# tiny-engine-renderer

## Introduction

A Vue3 renderer for tiny-engine.

## Usage

```javascript
// xxx.vue
import { h, reactive } from 'vue'
import Main from '@opentiny/tiny-engine-renderer'

export default {
  render() {
    // utils
    const utils = reactive({})
    // globalState
    const globalState = reactive([])
    // dataSource
    const dataSourceMap = reactive({})
    // schema
    const schema = reactive({})

    return schema.children.length ? h(Main, { schema, utils, globalState, dataSourceList }) : null
  }
}
```
