# 元应用&元服务

## 什么是元应用和元服务

在我们与用户沟通的过程中，我们发现，用户有一类"轻定制"的需求，他们希望能够定制页面上的一些UI、主题，或者一些布局的显隐。核心的功能不需要定制。
但是，我们提供的插件对于单纯的UI定制能力跟核心的功能绑定在一起，如果用户只希望定制UI，而不需要定制功能，则需要重新实现一个插件。
这样的成本同样是很高的，于是，我们基于这种场景的问题，把插件拆分出来了元应用与元服务两种概念：

元应用：负责插件的UI布局显示、负责响应用户的交互动作，然后调用元服务的数据、API进行交互。
元服务：负责抽象插件的核心功能（数据响应、提供给UI的API、与服务端交互的接口API），做到与UI无关，方便二次开发用户定制低代码平台时定制UI。

## 如何使用元应用和元服务

元应用和元服务都经过注册表传入到TinyEngine中。

读取元应用并渲染的方式：

```vue
<template>
 <component :is="entry"></component>
</template>
<script setup>
import { getMergeMeta } from '@opentiny/tiny-engine-meta-register'

// 获取元应用
const entry = getMergeMeta(comp).entry
</script>
```

读取元服务的方式：

```javascript
import { getMetaApi } from '@opentiny/tiny-engine-meta-register'

// 获取元服务的 api
const { getAllNestedBlocksSchema, generatePageCode } = getMetaApi('engine.service.generateCode')
```

## 如何自定义开发元应用元服务

自定义元应用：

```javascript
// UI 模板
import entry from './src/Main.vue'
import metaData from './meta'

export default {
  // 元应用定制项
  ...metaData,
  // 元应用入口
  entry
}
```

自定义元服务：

```javascript
export const GenerateCodeService = {
  // 元服务的 id
  id: 'engine.service.generateCode',
  // 元服务的类型
  type: 'MetaService',
  // 元服务定制项
  options: {},
  // 元服务的 api
  apis: {
    parseRequiredBlocks,
    getAllNestedBlocksSchema,
    generatePageCode,
    generateAppCode
  }
}
```
