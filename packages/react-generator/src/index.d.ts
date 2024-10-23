declare namespace tinyEngineDslVue {
  type defaultPlugins =
    | 'template'
    | 'block'
    | 'page'
    | 'dataSource'
    | 'dependencies'
    | 'globalState'
    | 'i18n'
    | 'router'
    | 'utils'
    | 'formatCode'
    | 'parseSchema'

  type IPluginFun = (schema: IAppSchema, context: IContext) => void

  interface IConfig {
    customPlugins?: {
      [key in defaultPlugins]?: IPluginFun
    } & {
      [key in 'transformStart' | 'transform' | 'transformEnd']?: Array<IPluginFun>
    }
    pluginConfig?: {
      [k in defaultPlugins]: Record<string, any>
    }
    customContext?: Record<string, any>
  }

  interface IContext {
    config: Record<string, any>
    genResult: Array<IFile>
    genLogs: Array<any>
    error: Array<any>
  }

  export function generateApp(config?: IConfig): codeGenInstance

  interface codeGenInstance {
    generate(IAppSchema): ICodeGenResult
  }

  interface ICodeGenResult {
    errors: Array<any>
    genResult: Array<IFile>
    genLogs: Array<any>
  }

  interface IFile {
    fileType: string
    fileName: string
    path: string
    fileContent: string
  }

  interface IAppSchema {
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

  interface IUtilsItem {
    name: string
    type: 'npm' | 'function'
    content: object
  }

  interface IDataSource {
    list: Array<{ id: number; name: string; data: object }>
    dataHandler?: IFuncType
    errorHandler?: IFuncType
    willFetch?: IFuncType
  }

  interface IFuncType {
    type: 'JSFunction'
    value: string
  }

  interface IExpressionType {
    type: 'JSExpression'
    value: string
  }

  interface IGlobalStateItem {
    id: string
    state: Record<string, any>
    actions: Record<string, IFuncType>
    getters: Record<string, IFuncType>
  }

  interface IPageSchema {
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
      isHome: boolean
      parentId: string
      rootElement: string
      route: string
    }
    children: Array<ISchemaChildrenItem>
    schema?: {
      properties: Array<Record<string, any>>
      events: Record<string, any>
    }
  }

  interface IFolderItem {
    componentName: 'Folder'
    depth: number
    folderName: string
    id: string
    parentId: string
    router: string
  }

  interface ISchemaChildrenItem {
    children: Array<ISchemaChildrenItem>
    componentName: string
    id: string
    props: Record<string, any>
  }

  interface IComponentMapItem {
    componentName: string
    destructuring: boolean
    exportName?: string
    package?: string
    version: string
  }

  interface IMetaInfo {
    name: string
    description: string
  }
}
