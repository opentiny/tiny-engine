# tiny-engine-renderer

## Introduction

A Vue3 renderer for tiny-engine.

## Usage

```javascript
// xxx.vue
import { h } from 'vue'
import Main, { api } from '@opentiny/tiny-engine-renderer'

const getSchema = () => {
  return newPromise((resolve) => {
    setTimeout(() => {
      const data = {
        state: {},
        children: [
          {
            componentName: 'Text',
            props: {
              text: 'Title'
            }
          }
        ]
      }
      resolve(data)
    }, 100)
  })
}

export default {
  setup() {
    onMounted(async () => {
      const schema = await getSchema()

      api.setSchema(schema)
    })
  },
  render() {
    return h(Main)
  }
}
```
