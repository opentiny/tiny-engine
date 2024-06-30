# 出码元服务

> 即出码适配层，官方的出码插件、页面预览会调用该  service 得到出码的结果

## 注册该 service

```javascript
import { GenerateCodeService } from '@opentiny/tiny-engine'

// 注册元服务
init({
  registry: {
    root: {
      id: 'engine.root',
      metas: [
        // 这里注入 出码元服务
        GenerateCodeService
        // ... 其他元服务
      ]
    },
    // ... other config or registry
  }
})
```

## 使用该 service

```javascript
import { getMetaApi } from '@opentiny/tiny-engine-meta-register'

// 通过 id 得到出码元服务
const generateCodeService = getMetaApi('engine.service.generateCode')

// 调用 api 得到页面出码结果
generateCodeService.generatePageCode(...args)
```

## 出码 service 官方 api

### parseRequiredBlocks

> api功能：解析页面 schema 或者 区块 schema 中依赖的区块

类型：

```typescript
// 页面或者区块 schema，这里类型省略其他属性
interface IPageOrBlockSchema {
  componentName?: string;
  componentType?: 'Block'
  children: IPageOrBlockSchema[]
}

function parseRequiredBlocks(schema: IPageOrBlockSchema): string[]
```

### getAllNestedBlocksSchema

> api 功能：递归解析页面 schema 或者区块 schema 中依赖的区块，并返回所有依赖区块的 schema

类型：

```typescript
function getAllNestedBlocksSchema(pageSchema: IPageOrBlockSchema, fetchBlockSchemaApi: Promise<IPageOrBlockSchema>, blockSet: Set<string>): IPageOrBlockSchema[]
```

### generatePageCode

> api 功能：单页面或者区块出码

类型：

```typescript
interface IComponentMapItem {
  componentName: string
  destructuring: boolean
  exportName?: string
  package?: string
  version: string
}
function generatePageCode(schema: IPageOrBlockSchema, componentsMap: IComponentMapItem[], config: object): string
```

### generateAppCode

> api 功能：应用出码

类型：

```typescript
// 可查看 https://github.com/opentiny/tiny-engine/blob/develop/packages/vue-generator/src/index.d.ts
// appSchema 为应用 schema IAppSchema
// options 为实例化配置 IConfig
function generateAppCode(appSchema:IAppSchema, options: IConfig): ICodeGenResult
```

## 替换该 service

如果您发现官方的出码并不能满足您的需求，您可以同样定制自己的出码 service。

替换要求：

- 自定义实现官方出码 service 的 api（parseRequiredBlocks、getAllNestedBlocksSchema、generatePageCode、generateAppCode），要求出参与入参一致
- id 与 官方出码 service id 一致，即为：engine.service.generateCode

最后，同样往注册表注入该 service 即可：

```javascript
export const GenerateCodeService = {
  id: 'engine.service.generateCode',
  type: 'MetaService',
  options: {},
  apis: {
    parseRequiredBlocks: xxx自定义实现,
    getAllNestedBlocksSchema: xxx 自定义实现,
    generatePageCode: xxx 自定义实现,
    generateAppCode:xxx 自定义实现
  }
}

init({
  registry: {
    root: {
      id: 'engine.root',
      metas: [
        // 自定义的出码元服务
        GenerateCodeService
      ]
    },
  }
})
```
