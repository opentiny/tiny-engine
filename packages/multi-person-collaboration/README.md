# Collaborative Low-Code Composables

## 功能特性 (Features)

### 1. useYjs
- 初始化 Yjs 协作文档 (`Y.Doc`)  
- 创建并管理 Provider，实现 WebSocket 同步  
- 提供 Awareness 状态管理  
- 提供连接状态监控 (`connecting | connected | disconnected | error`)  
- 自动清理资源，支持组件卸载时释放连接  

### 2. useAwareness
- 管理协作用户的实时状态  
- 响应远程用户的 `enter` / `change` / `leave` 事件  
- 提供类型安全的本地状态字段更新方法  
- 远程状态响应式 (`remoteStates`)  

### 3. useCollabCursor
- 实时同步光标位置与按下状态  
- 提供远程光标响应式数据 (`remoteCursors`)  
- 支持本地鼠标事件绑定：移动、按下、抬起  
- 初始化本地光标状态，防止空值  

### 4. useCollabSchema
- 协作编辑共享文档结构 (Schema)  
- 提供增删改节点 API：
  - 插入节点：`insertSharedNode`
  - 删除节点：`deleteSharedNode`
  - 移动节点：`moveUpSharedNode` / `moveDownSharedNode`
  - 修改样式：`updateStyleNode`
  - 修改属性：`updatePropsNode`
  - 修改方法：`updateMethodNode`
  - 修改 Attributes：`updateAttributesNode`
- 管理远程用户实时选中和拖拽状态  
- 同步完成后重建节点映射  
- 自动清理 observer 和事件监听  

### 5. useCollabMonaco
- 将 Yjs 文档绑定到 Monaco 编辑器，实现协作编辑  
- 注入 `currentUser` 到 Awareness，标识协作用户  
- 自动监听 Provider 同步状态并完成绑定  
- 确保绑定只执行一次，避免重复事件  
- 卸载时销毁绑定并清理监听器  

---

## 使用示例 (Usage)

### 1. useYjs
```ts
import { useYjs } from 'your-package'

const { ydoc, provider, awareness, status } = useYjs('room-1', { websocketUrl: 'ws://localhost:1234' })

console.log(status.value) // 'connecting' | 'connected' | ...
````

### 2. useAwareness
````ts
import { useAwareness } from 'your-package'

const { remoteStates, updateLocalStateField } = useAwareness(awareness, currentUser)

// 更新本地字段
updateLocalStateField('user', currentUser)
````

### 3. useCollabCursor

````ts
import { useCollabCursor } from 'your-package'

const { remoteCursors, updateCursorPositioin, mouseDownHandler, mouseUpHandler } =
  useCollabCursor({ roomId: 'room-1', currentUser })

// 鼠标事件绑定
element.addEventListener('mousemove', updateCursorPositioin)
element.addEventListener('mousedown', mouseDownHandler)
element.addEventListener('mouseup', mouseUpHandler)
````

### 4. useCollabSchema

````ts
import { useCollabSchema } from 'your-package'

const {
  remoteStates,
  insertSharedNode,
  deleteSharedNode,
  updateStyleNode,
  updatePropsNode,
  updateMethodNode,
  updateAttributesNode,
  updateUserSelection,
  updateDragState
} = useCollabSchema({ roomId: 'room-1', currentUser })

// 插入节点
insertSharedNode({ node, parent, data }, 'in')
// 删除节点
deleteSharedNode(nodeId)
// 更新节点样式
updateStyleNode('.cls { color: red }', nodeId, 'cls')
````

### 5. useCollabMonaco

````ts
import { useCollabMonaco } from 'your-package'

const { binding, yText, ydoc, provider } = useCollabMonaco({
  roomId: 'room-1',
  fieldName: 'code',
  editorRef,
  currentUser
})

// binding 已自动处理 Monaco 与 Yjs 的协作
````