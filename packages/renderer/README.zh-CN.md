# tiny-engine-renderer

## 简介

基于 Vue 3 的低代码渲染引擎。

## 用法

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
              text: '标题'
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
