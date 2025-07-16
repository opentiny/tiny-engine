export interface Property {
  label: {
    zh_CN?: string
  }
  description: {
    zh_CN?: string
  }
  collapse: {
    number: number
    text: {
      zh_CN?: string
    }
  }
  content?: BlockProperty[]
}

export interface BlockContent {
  componentName: string
  blockName?: string
  fileName: string
  css?: string
  props: Record<string, any>
  children: any[]
  schema: {
    properties?: Property[]
    events?: Record<string, any>
  }
  state?: Record<string, any>
  methods: Record<string, any>
  dataSource?: Record<string, any>
  i18n?: any
}

export interface BlockOccupier {
  id: number
  username: string
}

export interface Block {
  id?: string | number
  name_cn?: string
  label: string
  path?: string
  categories: string[]
  public: number
  is_published?: number
  framework: string
  content: BlockContent
  occupier?: BlockOccupier | null
  created_at?: string | Date
  updated_at?: string | Date
  histories?: any[]
  assets?: any
}

export interface BlockGroup {
  id: string
  name: string
  desc: string
  app: {
    id: string | number
    name: string
  }
  blocks: { data: Block }[]
  groupId: string
  groupName: string
}

export interface BlockProperty {
  linked?: { property: any; blockProperty: any } | null
  property: any
  defaultValue: any
  widget?: any
}

export interface SchemaData {
  langs: Record<string, any>
  methods: Record<string, any>
  state: Record<string, any>
  classNameList: string[]
  contentList: any[]
}

export type ParsePropToDataOptons = Pick<SchemaData, 'langs' | 'methods' | 'state'> & {
  prop: {
    type: string
    key: string
    value: any
  }
}

export type ParseChildPropsOptions = Pick<SchemaData, 'langs' | 'methods' | 'state'> & {
  child: {
    props: Record<string, any>
    [x: string]: any
  }
}

export interface CreateBlockOptions {
  name_cn: string
  label: string
  path?: string
  categories: string[]
}

export type CreateEmptyBlockOptions = Pick<Block, 'name_cn' | 'label' | 'path' | 'categories'>
