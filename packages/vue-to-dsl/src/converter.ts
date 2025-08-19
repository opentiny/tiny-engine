import { parseSFC } from './parser/index'
import { parseTemplate } from './parsers/templateParser'
import { parseScript } from './parsers/scriptParser'
import { parseStyle } from './parsers/styleParser'
import { generateSchema } from './generator/index'
import fs from 'fs/promises'
import path from 'path'

export interface VueToSchemaOptions {
  componentMap?: Record<string, string>
  preserveComments?: boolean
  strictMode?: boolean
  customParsers?: {
    template?: { parse: (code: string) => any }
    script?: { parse: (code: string) => any }
    style?: { parse: (code: string) => any }
  }
  fileName?: string
  path?: string
  title?: string
  description?: string
}

export interface ConvertResult {
  schema: any | null
  dependencies: string[]
  errors: string[]
  warnings: string[]
}

export class VueToDslConverter {
  private options: VueToSchemaOptions

  constructor(options: VueToSchemaOptions = {}) {
    this.options = {
      componentMap: {},
      preserveComments: false,
      strictMode: false,
      customParsers: {},
      ...options
    }
  }

  async convertFromString(vueCode: string): Promise<ConvertResult> {
    const errors: string[] = []
    const warnings: string[] = []
    const dependencies: string[] = []

    try {
      const sfcResult = parseSFC(vueCode)
      if (!sfcResult.template && !sfcResult.scriptSetup && !sfcResult.script) {
        throw new Error('Invalid Vue SFC: no template or script found')
      }

      let templateSchema: any[] = []
      let scriptSchema: any = {}
      let styleSchema: any = {}

      if (sfcResult.template) {
        try {
          templateSchema = this.options.customParsers?.template
            ? this.options.customParsers.template.parse(sfcResult.template)
            : parseTemplate(sfcResult.template, this.options as any)
        } catch (error: any) {
          errors.push(`Template parsing error: ${error.message}`)
          if (this.options.strictMode) throw error
        }
      }

      const scriptContent = sfcResult.scriptSetup || sfcResult.script
      if (scriptContent) {
        try {
          scriptSchema = this.options.customParsers?.script
            ? this.options.customParsers.script.parse(scriptContent)
            : parseScript(scriptContent, {
                isSetup: !!sfcResult.scriptSetup,
                ...(this.options as any)
              })

          if (scriptSchema.imports) {
            dependencies.push(...scriptSchema.imports.map((imp: any) => imp.source))
          }

          // Surface script parser soft errors returned by parseScript
          if ((scriptSchema as any).error) {
            const msg = (scriptSchema as any).error
            errors.push(`Script parsing error: ${msg}`)
            if (this.options.strictMode) throw new Error(msg)
          }
        } catch (error: any) {
          errors.push(`Script parsing error: ${error.message}`)
          if (this.options.strictMode) throw error
        }
      }

      if (sfcResult.style) {
        try {
          styleSchema = this.options.customParsers?.style
            ? this.options.customParsers.style.parse(sfcResult.style)
            : parseStyle(sfcResult.style, this.options as any)
        } catch (error: any) {
          errors.push(`Style parsing error: ${error.message}`)
          if (this.options.strictMode) throw error
        }
      }

      const schema = await generateSchema(templateSchema, scriptSchema, styleSchema, this.options as any)

      return {
        schema,
        dependencies: [...new Set(dependencies)],
        errors,
        warnings
      }
    } catch (error: any) {
      errors.push(`Conversion error: ${error.message}`)
      return { schema: null, dependencies: [], errors, warnings }
    }
  }

  async convertFromFile(filePath: string): Promise<ConvertResult> {
    try {
      const vueCode = await fs.readFile(filePath, 'utf-8')
      const result = await this.convertFromString(vueCode)

      const fileName = path.basename(filePath, '.vue')

      if (result.schema) {
        result.schema.fileName = fileName
        result.schema.meta.name = fileName
      }
      return result
    } catch (error: any) {
      return { schema: null, dependencies: [], errors: [`File reading error: ${error.message}`], warnings: [] }
    }
  }

  async convertMultipleFiles(filePaths: string[]): Promise<ConvertResult[]> {
    const results: ConvertResult[] = []
    for (const filePath of filePaths) {
      try {
        const result = await this.convertFromFile(filePath)
        results.push(result)
      } catch (error: any) {
        results.push({
          schema: null,
          dependencies: [],
          errors: [`Failed to convert ${filePath}: ${error.message}`],
          warnings: []
        })
      }
    }
    return results
  }

  setOptions(options: VueToSchemaOptions) {
    this.options = { ...this.options, ...options }
  }

  getOptions(): VueToSchemaOptions {
    return { ...this.options }
  }
}
