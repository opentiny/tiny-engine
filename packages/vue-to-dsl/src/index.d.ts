declare module '@opentiny/tiny-engine-vue-to-dsl' {
  export interface VueToSchemaOptions {
    // 组件映射配置
    componentMap?: Record<string, string>
    // 是否保留注释
    preserveComments?: boolean
    // 是否严格模式
    strictMode?: boolean
    // 自定义解析器
    customParsers?: {
      template?: TemplateParser
      script?: ScriptParser
      style?: StyleParser
    }
  }

  export interface TemplateParser {
    parse(template: string, options?: any): TemplateSchema
  }

  export interface ScriptParser {
    parse(script: string, options?: any): ScriptSchema
  }

  export interface StyleParser {
    parse(style: string, options?: any): StyleSchema
  }

  export interface TemplateSchema {
    componentName: string
    props?: Record<string, any>
    children?: TemplateSchema[]
    condition?: string
    loop?: string
    key?: string
    ref?: string
    [key: string]: any
  }

  export interface ScriptSchema {
    state?: Record<string, any>
    methods?: Record<string, any>
    computed?: Record<string, any>
    lifecycle?: Record<string, any>
    imports?: ImportInfo[]
    props?: PropInfo[]
    emits?: string[]
  }

  export interface StyleSchema {
    css: string
    scoped?: boolean
    lang?: string
  }

  export interface ImportInfo {
    source: string
    specifiers: string[]
    default?: string
  }

  export interface PropInfo {
    name: string
    type?: string
    default?: any
    required?: boolean
  }

  export interface PageSchema {
    componentName: 'Page'
    fileName: string
    path: string
    meta?: Record<string, any>
    state?: Record<string, any>
    methods?: Record<string, any>
    computed?: Record<string, any>
    lifecycle?: Record<string, any>
    props?: PropInfo[]
    css?: string
    children?: TemplateSchema[]
  }

  export interface ConvertResult {
    schema: PageSchema
    dependencies: string[]
    errors: string[]
    warnings: string[]
  }

  export class VueToDslConverter {
    constructor(options?: VueToSchemaOptions)

    /**
     * 将Vue SFC文件内容转换为DSL Schema
     */
    convertFromString(vueCode: string): Promise<ConvertResult>

    /**
     * 将Vue SFC文件转换为DSL Schema
     */
    convertFromFile(filePath: string): Promise<ConvertResult>

    /**
     * 批量转换多个Vue文件
     */
    convertMultipleFiles(filePaths: string[]): Promise<ConvertResult[]>
  }

  /**
   * 解析Vue SFC文件
   */
  export function parseVueFile(filePath: string): Promise<{
    template?: string
    script?: string
    style?: string
    scriptSetup?: string
  }>

  /**
   * 解析Vue SFC代码字符串
   */
  export function parseSFC(vueCode: string): {
    template?: string
    script?: string
    style?: string
    scriptSetup?: string
  }

  /**
   * 生成DSL Schema
   */
  export function generateSchema(
    template: string,
    script: string,
    style?: string,
    options?: VueToSchemaOptions
  ): Promise<PageSchema>

  /**
   * 解析模板
   */
  export function parseTemplate(template: string): TemplateSchema[]

  /**
   * 解析脚本
   */
  export function parseScript(script: string): ScriptSchema

  /**
   * 解析样式
   */
  export function parseStyle(style: string): StyleSchema
}
