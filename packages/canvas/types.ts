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
