import type { Node, RootNode } from '../../../types'

export type PageSchema = RootNode

export type AIHelperState = 'hidden' | 'chat' | 'loading' | 'confirm' | 'completed'

export interface NodeAIStatus {
  state: AIHelperState
  collapsed?: boolean // 面板是否收起（收起时保留原状态，重新打开可恢复）
  aiContext?: any
  lastAIAction?: string
  aiHistory?: Array<{
    timestamp: number
    action: string
    content: any
  }>
  chatContent?: string // 聊天内容
  // AI采纳状态相关字段
  originalNodeData?: any // AI修改前的节点数据备份
  aiModifiedNodeData?: any // AI修改后的节点数据
}

export interface NodeStatus {
  [key: string]: any
}

export interface PageState {
  currentVm?: unknown
  currentSchema?: { [x: string]: any; id: string }
  currentType?: unknown
  currentPage?: { [x: string]: any; id: string; name: string } | null
  currentPageId?: string
  currentPageName?: string
  hoverVm?: unknown
  pageSchema: RootNode | null
  properties?: unknown
  dataSource?: unknown
  dataSourceMap?: unknown
  isSaved: boolean
  isLock: boolean
  isBlock: boolean
  nodesStatus: Record<string, NodeStatus>
  aiNodesStatus: Record<string, NodeAIStatus> // AI状态独立存储，避免与nodesStatus的可见性(false)冲突
  loading: boolean
}

export interface InsertOperation {
  parentId: string
  newNodeData: Node
  position: string
  referTargetNodeId?: string
}

export interface DeleteOperation {
  id: string
}

export interface ChangePropsOperation {
  id: string
  value: {
    props?: any
  }
  option?: {
    overwrite?: boolean
  }
}

export interface UpdateAttributesOperation {
  id: string
  value: any
  overwrite?: boolean
}

export type NodeOperation =
  | (InsertOperation & { type: 'insert' })
  | (DeleteOperation & { type: 'delete' })
  | (ChangePropsOperation & { type: 'changeProps' })
  | (UpdateAttributesOperation & { type: 'updateAttributes' })
