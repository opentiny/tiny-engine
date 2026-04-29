import type { Node, RootNode } from '../../../types'

export type PageSchema = RootNode

export type AIHelperState = 'hidden' | 'chat' | 'loading' | 'confirm' | 'completed'

export interface NodeAIStatus {
  state: AIHelperState
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
  aiStatus?: NodeAIStatus // 现在包含了所有的AI状态，包括采纳状态
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
