import * as Y from 'yjs'

// 基础节点类型
export interface NodeSchema {
  componentName: string
  fileName?: string
  css?: string
  props?: Record<string, any>
  lifeCycles?: Record<string, (...args: unknown[]) => unknown>
  children?: NodeSchema[] // 支持递归嵌套
  dataSource?: {
    list: any[]
  }
  methods?: Record<string, (...args: unknown[]) => unknown>
  bridge?: {
    imports: string[]
  }
  state?: Record<string, any>
  inputs?: any[]
  outputs?: any[]
}

export interface Node {
  id: string
  componentName: string
  props: Record<string, any> & { columns?: { slots?: Record<string, any> }[] }
  children?: Node[]
  componentType?: 'Block' | 'PageStart' | 'PageSection'
  slot?: string | Record<string, any>
  params?: string[]
  loop?: Record<string, any>
  loopArgs?: string[]
  condition?: boolean | Record<string, any>
}

export type RootNode = Omit<Node, 'id'> & {
  id?: string
  css?: string
  fileName?: string
  methods?: Record<string, any>
  state?: Record<string, any>
  lifeCycles?: Record<string, any>
  dataSource?: any
  bridge?: any
  inputs?: any[]
  outputs?: any[]
  schema?: any
}

export type PageSchema = RootNode

// Yjs Schema 文档结构
export type YNodeSchema = Y.Map<any>

export interface InsertOptions {
  parent: Node | RootNode
  node: Node | RootNode
  data: Node
}

// 定义插入位置类型
export const POSITION = Object.freeze({
  TOP: 'top',
  BOTTOM: 'bottom',
  LEFT: 'left',
  RIGHT: 'right',
  IN: 'in',
  OUT: 'out',
  REPLACE: 'replace'
} as const)

export type PositionType = typeof POSITION[keyof typeof POSITION]

export interface InsertOperation {
  parentId: string
  newNodeData: Node
  position: string
  referTargetNodeId?: string
}

export type NodeOperation = InsertOperation & { type: 'insert' }

export interface DeleteOperation {
  id: string
}

export interface MoveOperation {
  parentId: string
  targetId: string
  direction: 'up' | 'down'
}

export interface UpdateStyleOperation {
  strStyle: string
  nodeId: string
  className: string
}

export interface UpdatePropsOperation {
  newProps: Record<string, any>
  nodeId: string
  overwrite: boolean
}

export type UpdateMethodsOperation =
  | { type: 'root'; methods: Record<string, any> }
  | { type: 'node'; nodeId: string; methodsName: string; methods: Record<string, any>; params: any }
  | { type: 'delete-method'; nodeId: string; methodsName: string }

export type UpdateAttributesOperation =
  | { type: 'loop'; value: Record<string, any>; nodeId: string }
  | { type: 'loopArgs'; value: Record<string, any>; nodeId: string }
  | { type: 'condition'; value: boolean; nodeId: string }
  | { type: 'clean'; nodeId: string }

export type UpdateAttributesRole = 'loop' | 'loopArgs' | 'condition' | 'clean'

export interface UserAwareness {
  id?: string | number
  name: string
  color: string
  avatarUrl?: string
}

export interface Cursor {
  x: number
  y: number
}

export interface Selection {
  anchor: number
  head: number
}

// 定义拖拽状态的数据结构
export interface DragState {
  status: 'start' | 'drag' | 'end'
  nodeId: string
  position?: { x: number; y: number } // 拖拽过程中的位置
}
