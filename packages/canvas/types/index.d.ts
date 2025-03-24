export interface Node {
  id: string
  componentName: string
  props: Record<string, any> & { columns?: { slots?: Record<string, any> }[] }
  children?: Node[]
}

export type PageSchema = Omit<Node, 'id'> & {
  id?: string
  css?: string
  fileName: string
  methods?: Record<string, any>
  state?: Record<string, any>
  lifeCycles?: Record<string, any>
  dataSource?: any
  bridge?: any
  inputs?: any[]
  outputs?: any[]
}

export type RootNode = PageSchema

export interface PageState {
  currentVm?: unknown
  currentSchema?: unknown
  currentType?: unknown
  currentPage?: unknown
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

export interface DragOffset {
  offsetX: number
  offsetY: number
  horizontal: string
  vertical: string
  width: number
  height: number
  x: number
  y: number
}
