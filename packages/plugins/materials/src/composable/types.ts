export interface Material {
  components: Component[]
  snippets?: Snippet[]
  blocks?: Block[]
  packages?: Package[]
}

export interface Block {
  id: number | string
  label: string
  framework: string
  content: BlockResource
  created_by?: unknown
  updated_by?: unknown
  created_at: Date
  updated_at: Date
  assets: Assets
  createdBy: CreatedBy
  updatedBy: number
  last_build_info: BuildInfo
  description?: unknown
  tags: any[]
  current_history: number
  screenshot: string
  path: string
  occupier?: CreatedBy
  isOfficial?: boolean
  public: number
  isDefault?: boolean
  tiny_reserved?: boolean
  author?: unknown
  name_cn?: string
  npm_name: string
  created_app?: unknown
  content_blocks?: unknown
  histories: History[]
  categories: any[]
  public_scope_tenants: any[]
  histories_length: number
  state?: unknown
}

export interface Assets {
  material: string[]
  scripts: string[]
  styles: string[]
}

export type Resource = Omit<Component, 'component'> & { type: string; component?: string; item?: string }

export interface BlockResource {
  componentName: string
  fileName: string
  css?: string
  props: Record<string, any>
  dataSource?: Record<string, any>
  schema: Schema
  children: Schema[]
  state?: Record<string, any>
  methods: {
    [key: string]: TypeValuePair
  }
  lifeCycles?: {
    [key: string]: TypeValuePair
  }
  id?: string | number
  type?: string
  component?: string
  label?: string
  configure?: Configure
  actions?: unknown
  blockName?: string
  properties?: Property[]
}

export interface TypeValuePair {
  type: DataTypeEnum
  value: string
}

export type DataTypeEnum = 'JSExpression' | 'JSFunction' | 'JSResource' | 'JSResouce'

export interface Locale {
  zh_CN?: string
}

export interface Collapse {
  number: number
  text: Locale
}

export interface Linked {
  componentName: string
  property: string
  id: string
  blockProperty: any
}

export interface CreatedBy {
  id: number
  username: string
}

export interface History {
  id: number
  message: string
  content: unknown
  assets?: Assets
  build_info?: BuildInfo
  created_by?: unknown
  updated_by?: unknown
  created_at: Date | string
  updated_at: Date | string
  screenshot?: string
  path?: string
  label?: string
  description?: unknown
  mode?: string | null
  block_id: number
  version?: string | null
  npm_name?: string
  i18n?: unknown
  created_app?: unknown
  content_blocks?: unknown
}

export interface BuildInfo {
  result: boolean
  versions: string[]
  endTime: string
}

export interface Component {
  id?: number | string
  version?: string
  name: {
    zh_CN?: string
  }
  component: string
  icon: string
  description?: string
  doc_url?: string
  screenshot?: string
  tags?: string
  keywords?: string
  dev_mode?: string
  npm?: Npm
  group?: string
  configure?: Configure
  content?: { configure?: Configure; schema?: Schema }
  createdBy?: number
  created_at?: Date | string
  updated_at?: Date | string
  public?: number
  framework?: string
  isOfficial?: boolean
  isDefault?: boolean
  tiny_reserved?: boolean
  component_metadata?: {
    events?: unknown[]
    attrs?: unknown[]
    slots?: unknown
  }
  library?: number
  schema: Schema
}

export interface Configure {
  loop?: boolean
  condition?: boolean
  styles?: boolean
  isContainer?: boolean
  isModal?: boolean
  nestingRule?: NestingRule
  isNullNode?: boolean
  isLayout?: boolean
  string?: string
  shortcuts?: {
    properties: string[]
  }
  contextMenu?: ContextMenu
  slots?: string[]
  framework?: string
  isPopper?: boolean
  invalidity?: string[]
  clickCapture?: boolean
}

export interface ContextMenu {
  actions: string[]
  disable: string[]
}

export interface Property {
  label: Locale
  description?: Locale
  collapse?: Collapse
  content: {
    [x: string]: unknown
    property: string
    label?: {
      text: Locale
    }
    required?: boolean
    readOnly?: boolean
    disabled?: boolean
    cols?: number
    widget: {
      component: string
      props?: Record<string, any>
    }
    description?: Locale
    labelPosition?: string
    type?: string
    defaultValue?: unknown
    rules?: any[]
    hidden?: boolean
    device?: any[]
    onChange?: string
    properties?: ContentProperty[]
    linked?: Linked | null
    handle?: Record<string, any>
  }[]
  name?: string
  group?: string
  defaultValue?: unknown
}

export interface ContentProperty {
  label: Locale
  content: {
    property: string
    type?: string
    defaultValue?: boolean | string
    label: {
      text: Locale
    }
    widget: {
      component: string
      props: Record<string, any>
    }
    labelPosition?: string
    required?: boolean
    readOnly?: boolean
    disabled?: boolean
    cols?: number
    description?: Locale
  }[]
}

export interface Package {
  name: string
  packageName: string
  package?: string
  version: string
  script: string
  css: string
  others?: unknown
}

export interface Snippet {
  group: string
  children: SnippetChild[]
}

export interface SnippetChild {
  icon?: string
  name?: Locale
  schema?: Schema
  screenshot?: string
  snippetName?: string
  configure?: Configure
  group?: boolean
  component?: string
  description?: string
  docUrl?: string
  tags?: string
  keywords?: string
  devMode?: string
  npm?: Dependency
  priority?: number
}

export interface Npm {
  package: string
  exportName: string
  version?: string
  destructuring?: boolean
  script?: string
  css?: string
  dependencies?: unknown
}

export type Dependency = Omit<Npm, 'exportName'> & {
  components?: any
}

export interface NestingRule {
  string?: string[] | string
  parentWhitelist?: string[]
  descendantBlacklist?: string[]
  ancestorWhitelist?: string[]
}

export interface Schema {
  props?: Record<string, any>
  children?: Schema[]
  componentName?: string
  componentType?: string
  properties?: Property[]
  events?: Record<string, any>
  slots?: Record<string, any>
  lifeCycles?: Record<string, TypeValuePair>
  id?: string
  condition?: boolean
  fileName?: string
}

export interface MaterialState {
  components: Snippet[]
  blocks: { groupId: string; groupName: string; children: Block[] }[]
  componentsDepsMap: {
    scripts: Dependency[]
    styles: Set<unknown>
  }
  packages: never[]
}

export type ComponentMap = Dependency & { componentName: string }

export interface InitMaterialOptions {
  isInit?: boolean
  appData?: {
    [x: string]: any
    componentsMap?: Array<ComponentMap>
  }
}
