// 应用级Schema类型定义
export interface IAppSchema {
  id: string
  pages: any[]
  bridge: any[]
  componentsMap: ComponentMap[]
  componentsTree: PageSchema[]
  css: string
  dataSource: DataSourceConfig
  utils: Util[]
  packages: PackageConfig[]
  meta: AppMeta
  config: AppConfig
  constants: string
  i18n: I18nConfig
  version: string
  blocks: Record<string, BlockSchema>
}

// 组件映射表
export interface ComponentMap {
  package?: string | null
  destructuring: boolean
  exportName?: string | null
  componentName: string
  version: string
  npmrc?: any
  path?: string
  dependencies?: {
    scripts: Array<{
      package?: string
      components: Record<string, string>
    }>
    styles: any[]
  }
}

// 页面Schema
export interface PageSchema {
  children: ComponentNode[]
  css: string
  componentName: string
  fileName: string
  lifeCycles?: LifeCycles | null
  meta: PageMeta
  methods: Record<string, JSFunction>
  props: Record<string, any>
  state: Record<string, any>
}

export interface PageContent {
  children: ComponentNode[]
  css: string
  componentName: string
  fileName: string
  lifeCycles?: LifeCycles | null
  methods: Record<string, JSFunction>
  props: Record<string, any>
  state: Record<string, any>
}

// 组件节点
export interface ComponentNode {
  componentName: string
  props: Record<string, any>
  children: ComponentNode[] | string
  id: string
  componentType?: string
  loop?: JSExpression
}

// 页面元信息
export interface PageMeta {
  app: number
  gmt_create: string
  lastUpdatedBy: string
  creator: string
  rootElement: boolean
  contentBlocks: any[]
  isHome: boolean
  occupier: UserInfo
  gmt_modified: string
  parentId: string
  occupierBy: string
  isDefault: boolean
  router: string
  depth: number
  tenantId: string
  name: string
  page_content?: any
  id: string
  isPage: boolean
  group: string
}

// 用户信息
export interface UserInfo {
  id: string
  createdBy: string
  lastUpdatedBy: string
  tenantId: string
  siteId: string
  username: string
  email: string
  isAdmin: boolean
  created_at: string
  updated_at: string
}

// 生命周期钩子
export interface LifeCycles {
  setup?: JSFunction
  onBeforeMount?: JSFunction
  onMounted?: JSFunction
  onUpdated?: JSFunction
  onBeforeUpdate?: JSFunction
  onBeforeUnmount?: JSFunction
  onUnmounted?: JSFunction
  onErrorCaptured?: JSFunction
  onActivated?: JSFunction
  onDeactivated?: JSFunction
}

// JS函数
export interface JSFunction {
  type: 'JSFunction'
  value: string
}

// JS表达式
export interface JSExpression {
  type: 'JSExpression'
  value: string
  model?: boolean
}

// 数据源配置
export interface DataSourceConfig {
  dataHandler?: JSFunction
  list: DataSourceItem[]
}

// 数据源项
export interface DataSourceItem {
  id: number
  name: string
  data: {
    columns: DataSourceColumn[]
    data: any[]
    type: string
    options?: {
      method: string
      uri: string
    }
    dataHandler?: JSFunction
    willFetch?: JSFunction
    shouldFetch?: JSFunction
    errorHandler?: JSFunction
  }
  tpl?: any
  app: number
  platformId: number
  description?: any
  created_by: string
  last_updated_by: string
  created_at: string
  updated_at: string
}

// 数据源列
export interface DataSourceColumn {
  name: string
  title: string
  field: string
  type: string
  format: any
}

// 工具函数
export interface Util {
  name: string
  type: string
  content: Record<string, any>
}

// 包配置
export interface PackageConfig {
  name: string
  version: string
  script: string
  css?: string
  others?: any
  package: string
}

// 应用元信息
export interface AppMeta {
  appId: string
  branch: string
  creator: string
  description: string
  name: string
  gitGroup?: any
  globalState: GlobalState[]
  projectName?: any
  tenant?: any
  gmtCreate: string
  gmtModified: string
  isDemo?: any
}

// 全局状态
export interface GlobalState {
  id: string
  state: Record<string, any>
  getters: Record<string, JSFunction>
  actions: Record<string, JSFunction>
}

// 应用配置
export interface AppConfig {
  targetRootID: string
  sdkVersion: string
  historyMode: string
}

// 国际化配置
export interface I18nConfig {
  en_US: Record<string, any>
  zh_CN: Record<string, any>
}

// 区块Schema类型定义
export interface BlockSchema {
  data: BlockItem[]
  code: string
  message: string
  error: any
  errMsg: any
  success: boolean
}

// 区块项
export interface BlockItem {
  id: number
  createdBy: string
  lastUpdatedBy: string
  tenantId: string
  renterId?: any
  siteId?: any
  label: string
  framework: string
  content: BlockContent
  assets: any
  description?: any
  tags: any[]
  screenshot?: any
  path?: any
  i18n: any
  created_at: string
  updated_at: string
  name_cn: string
  last_build_info: {
    result: boolean
    versions: string[]
    endTime: string
  }
  version: string
  current_history: number
  occupier: string
  is_official: boolean
  public: number
  is_default: boolean
  tiny_reserved?: any
  npm_name?: any
  platform_id: number
  created_app: number
  content_blocks?: any
  public_scope_tenants: any[]
  histories_length: number
  is_published: boolean
  current_version?: any
}

export interface IBlockItem {
  schema: BlockContent
  meta: {
    id: number
    label: string
    framework: string
    version: string
  }
}

// 区块内容
export interface BlockContent {
  componentName: string
  fileName: string
  css: string
  props: Record<string, any>
  children: ComponentNode[]
  schema: BlockSchemaConfig
  state: Record<string, any>
  methods: Record<string, JSFunction>
  dataSource: any
  dependencies: {
    scripts: Array<{
      package?: string
      components: Record<string, string>
    }>
    styles: any[]
  }
  id: string
}

// 区块Schema配置
export interface BlockSchemaConfig {
  properties: Array<{
    label: {
      zh_CN: string
    }
    description: {
      zh_CN: string
    }
    collapse: {
      number: number
      text: {
        zh_CN: string
      }
    }
    content: Array<{
      property: string
      type: string
      defaultValue: any
      label: {
        text: {
          zh_CN: string
        }
      }
      cols: number
      rules: any[]
      accessor?: {
        setter?: JSFunction
      }
      hidden: boolean
      required: boolean
      readOnly: boolean
      disabled: boolean
      widget: {
        component: string
        props: any
      }
      properties: any[]
    }>
  }>
  events: any
  slots: any
}
