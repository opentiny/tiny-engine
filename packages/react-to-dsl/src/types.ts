export type JSExpression = {
  type: 'JSExpression'
  value: string
}

export interface IFuncType {
  type: 'JSFunction'
  value: string
}

export interface IFileItem {
  fileType: string
  fileName: string
  path: string
  fileContent: string
}

export interface IComponentMapItem {
  componentName: string
  destructuring: boolean
  exportName?: string
  package?: string
  version: string
}

export interface ISchemaChildrenItem {
  children: Array<ISchemaChildrenItem>
  componentName: string
  id: string
  props: Record<string, any>
}

export interface IFolderItem {
  componentName: 'Folder'
  depth: number
  folderName: string
  id: string
  parentId: string
  router: string
}

export interface IPageSchema {
  componentName: 'Page' | 'Block'
  css: string
  fileName: string
  lifeCycles: {
    [key: string]: Record<string, IFuncType>
  }
  methods: Record<string, IFuncType>
  props: Record<string, any>
  state: Array<Record<string, any>>
  meta: {
    id: number
    isPage: boolean
    isHome: boolean
    parentId: string
    router: string
  }
  children: Array<ISchemaChildrenItem>
  schema?: {
    properties: Array<Record<string, any>>
    events: Record<string, any>
  }
}

export interface IUtilsItem {
  name: string
  type: 'npm' | 'function'
  content: object
}

export interface IDataSource {
  list: Array<{ id: number; name: string; data: object }>
  dataHandler?: IFuncType
  errorHandler?: IFuncType
  willFetch?: IFuncType
}

export interface IGlobalStateItem {
  id: string
  state: Record<string, any>
  actions: Record<string, IFuncType>
  getters: Record<string, IFuncType>
}

export interface IMetaInfo {
  name: string
  description: string
}

export interface IAppSchema {
  i18n: {
    en_US: Record<string, any>
    zh_CN: Record<string, any>
  }
  utils: Array<IUtilsItem>
  dataSource: IDataSource
  globalState: Array<IGlobalStateItem>
  pageSchema: Array<IPageSchema | IFolderItem>
  blockSchema: Array<IPageSchema>
  componentsMap: Array<IComponentMapItem>
  meta: IMetaInfo
}
