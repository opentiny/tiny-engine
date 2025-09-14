import { useCanvas } from '@opentiny/tiny-engine-meta-register'
import { onUnmounted, toRaw } from 'vue'
import { SchemaManager } from '../services/schemaManager'
import { POSITION, type Node, type PositionType, type RootNode, type UserAwareness } from '../type'
import { useYjs } from './useYjs'
import { PORT } from '../config'
import { useAwareness } from './useAwareness'

interface UseCollabSchemaOptions {
  roomId: string // 协同文档的房间 ID
  currentUser: UserAwareness // 当前用户信息，用于 Awareness
}

// 定义此场景下的 Awareness 状态结构
interface SchemaAwarenessState {
  user: UserAwareness
  selection: {
    id: string
    top?: number
    left?: number
    width?: number
    height?: number
    scrollTop?: number
    schema?: any
    parent?: {
      id: string
      children: Node[]
    }
  }
  drag: {
    status: 'start' | 'drag'
    nodeId: string
    position?: { x: number; y: number }
  }
}

/**
 * useCollabSchema Composable
 * 职责:
 * 1. 整合 Y.Doc (持久化数据) 和 Y.Awareness (瞬时状态) 的同步。
 * 2. 提供对共享文档结构 (Schema) 的增删改 API。
 * 3. 提供对远程用户实时状态的响应式数据和更新 API。
 */
export function useCollabSchema(options: UseCollabSchemaOptions) {
  const { roomId, currentUser } = options
  const { awareness, provider } = useYjs(roomId, { websocketUrl: `ws://localhost:${PORT}` })
  const { remoteStates, updateLocalStateField } = useAwareness<SchemaAwarenessState>(awareness, currentUser)

  // 获取 NodeSchemaModel 实例
  const schemaManager = SchemaManager.getInstance()
  const schemaModel = schemaManager.createSchema(roomId, provider.value!)

  // 拖拽节点
  const insertSharedNode = (
    node: { node: Node | RootNode; parent: Node | RootNode; data: Node },
    position: PositionType = POSITION.IN
  ) => {
    schemaModel.insertNode(node, position)
  }

  // 删除节点，更新共享 schema，同步到远端
  const deleteSharedNode = (nodeId: string) => {
    schemaModel.deleteNode(nodeId)
  }

  // canvas 内，节点向上移动
  const moveUpSharedNode = (parentId: string, targetId: string, direction: 'up') => {
    schemaModel.moveNode(parentId, targetId, direction)
  }

  // canvas 内，节点向下移动
  const moveDownSharedNode = (parentId: string, targetId: string, direction: 'down') => {
    schemaModel.moveNode(parentId, targetId, direction)
  }

  // canvas 内，修改节点样式
  const updateStyleNode = (styleStr: string, nodeId: string, className: string) => {
    schemaModel.updatedNodeCss(styleStr, nodeId, className)
  }

  // settings， 修改节点属性
  const updatePropsNode = (newProps: Record<any, any>, nodeId: string, overwrite: boolean) => {
    schemaModel.updatedNodeProps(newProps, nodeId, overwrite)
  }

  // 用户信息同步 方法
  const updateUserSelection = (selectedNode: any) => {
    updateLocalStateField('selection', selectedNode)
  }
  const updateDragState = (dragState: SchemaAwarenessState['drag']) => {
    updateLocalStateField('drag', dragState)
  }

  // 等 provider 同步完成后，重建映射
  provider.value!.on('sync', (isSynced: boolean) => {
    if (isSynced) {
      // eslint-disable-next-line no-console
      console.log(`[schema-yjs] Yjs 同步完成，重建映射`)
      const pageSchema = toRaw(useCanvas().getPageSchema())
      schemaModel.operationHandler.rebuildYNodeMap(pageSchema as RootNode)
    }
  })

  // 组件卸载时取消监听
  onUnmounted(() => {
    schemaManager.destroyObserver(roomId)
    provider.value?.off('sync', () => {})
    // awareness.value?.destroy()
  })

  return {
    remoteStates,
    updateUserSelection,
    updateDragState,
    insertSharedNode,
    deleteSharedNode,
    moveUpSharedNode,
    moveDownSharedNode,
    updateStyleNode,
    updatePropsNode
  }
}
