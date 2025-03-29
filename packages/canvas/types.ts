export interface Node {
  id: string
  componentName: string
  props: Record<string, any> & { columns?: { slots?: Record<string, any> }[] }
  children?: Node[]
}

export type RootNode = Omit<Node, 'id'> & {
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
