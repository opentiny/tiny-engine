# schema 元服务相关API（Experimental）

## 直接修改 schema 引用 & 调用通知更新

使用示例：

```javascript
import { useCanvas, useMessage } from '@opentiny/tiny-engine-meta-register'

const pageSchema = useCanvas().getPageSchema()

pageSchema.css = "xxxx"

useMessage().publish({ topic: 'schemaChange' })
```

注意：直接修改 schema 引用当前不能涉及到节点的增加、删除，不然会节点树 nodesMap 无法更新，导致画布无法选中新增的组件。


> 注意：以下所有 API 皆为 Experimental 实验 API，请不要用在生产阶段

## 导入/导出 schema

> 这里的导入导出仅包含页面级别，不包含应用级别 schema

**导入 schema:**

```javascript
import { useCanvas } from '@opentiny/tiny-engine-meta-register'

const data = { /*页面/区块 schema*/ }

useCanvas().importSchema(data)
```

**导出 schema:**

```javascript
import { useCanvas } from '@opentiny/tiny-engine-meta-register'

useCanvas().exportSchema()
```

## 页面 schema相关操作

> 主要描述对页面 schema 的增删查改操作

### 获取当前页面/区块 schema:

```javascript
import { useCanvas } from '@opentiny/tiny-engine-meta-register'

useCanvas().getPageSchema()
```

### 获取当前选中节点 schema:

```javascript
import { useProperties } from '@opentiny/tiny-engine-meta-register'

const schema = useProperties().getSchema()
```

### 根据 id 查询对应的 节点schema(schema 片段)

```javascript
import { useCanvas } from '@opentiny/tiny-engine-meta-register'

const schema = useCanvas().getNode('453254', false)
```

类型：

```typescript
/**
 * 根据节点 id 获取 schema 片段
 * id: schema id
 * parent: 是否需要同时获取 parent 节点
 */
type getNode = (id: string, parent: boolean) => INode | { node: INode; parent: INode }
```

### 节点操作

#### 插入节点

使用示例：

```javascript
import { useCanvas } from '@opentiny/tiny-engine-meta-register'

useCanvas().operateNode({
  type: 'insert',
  parentId: '432423',
  newNodeData: { componentName: 'div', props: {}, children: [] },
  position: 'after',
  referTargetNodeId: '898432'
})
```

类型：

```typescript
interface IInsertOperation {
  // 操作类型为 insert
  type: 'insert';
  // 要插入的节点的 父节点 id
  parentId: string;
  // 新节点数据
  newNodeData: INode;
  // 相对节点的 id，比如我们想要插入父节点 id 中 第 5 个 children 的后面，或者前面
  referTargetNodeId: string;
  // 相对节点的位置
  position: 'after' | 'before';
}
```

#### 删除节点

使用示例：

```javascript
import { useCanvas } from '@opentiny/tiny-engine-meta-register'

useCanvas().operateNode({
  type: 'delete',
  id: '432423'
})
```

类型：

```typescript
interface IDeleteOperation {
  type: 'delete';
  id: string;
}
```

#### 修改节点 props

使用示例：

```javascript
import { useCanvas } from '@opentiny/tiny-engine-meta-register'

useCanvas().operateNode({
  type: 'changeProps',
  id: '432423',
  value: { text: 'TinyEngine' },
  option: { overwrite: false }
})
```

类型：

```typescript
interface IChangePropsOperation {
  type: 'changeProps';
  // 节点 id
  id: string;
  // 新的 props 值
  value: Record<string, any>;
  // 操作类型：是否覆写
  option: { overwrite: boolean; }
}
```

#### 更新节点属性

使用示例：

```javascript
import { useCanvas } from '@opentiny/tiny-engine-meta-register'

useCanvas().operateNode({
  type: 'updateAttributes',
  id: '432423',
  value: { props: { ... }, loop: { ... } },
  overwrite: boolean
})
```

类型：

```typescript
interface IUpdateAttrOperation {
  type: 'updateAttributes';
  id: string;
  // 对节点的属性修改
  value: Record<string, any>;
  // 是否是直接覆盖
  overwrite: boolean;
}
```
