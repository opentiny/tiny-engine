import type { Node, RootNode } from '../../../types'

export type PageSchema = RootNode

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
  nodesStatus: Record<string, any>
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
