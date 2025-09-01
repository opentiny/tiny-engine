import { parseSFC } from './parser/index'
import { parseTemplate } from './parsers/templateParser'
import { parseScript } from './parsers/scriptParser'
import { parseStyle } from './parsers/styleParser'
import { generateSchema, generateAppSchema } from './generator/index'
import { defaultComponentMap } from './constants'
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
      componentMap: defaultComponentMap,
      preserveComments: false,
      strictMode: false,
      customParsers: {},
      ...options
    }
  }

  async convertFromString(vueCode: string, fileName?: string): Promise<ConvertResult> {
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

      // Set fileName in options for schema generation
      if (fileName) {
        this.options.fileName = fileName.replace(/\.vue$/i, '')
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
      const fileName = path.basename(filePath, '.vue')
      const result = await this.convertFromString(vueCode, fileName)
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

  // Recursively walk a directory and collect files that match a predicate
  private async walk(dir: string, filter: (p: string, stat: any) => boolean, acc: string[] = []): Promise<string[]> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true } as any)
      for (const entry of entries as any[]) {
        const p = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          await this.walk(p, filter, acc)
        } else if (entry.isFile() && filter(p, entry)) {
          acc.push(p)
        }
      }
    } catch {
      // ignore missing dirs
    }
    return acc
  }

  // Convert a full app directory (e.g., test/full/input/appdemo01) into an aggregated schema.json
  async convertAppDirectory(appDir: string): Promise<any> {
    const srcDir = path.join(appDir, 'src')
    const viewsDir = path.join(srcDir, 'views')

    // 1) Collect page schemas from all .vue files under src/views/**
    const vueFiles = await this.walk(viewsDir, (p) => p.endsWith('.vue'))
    const pageResults = await this.convertMultipleFiles(vueFiles)
    const pageSchemas = pageResults.map((r) => r.schema).filter(Boolean)

    // 2) Load i18n
    let i18n: any = { en_US: {}, zh_CN: {} }
    try {
      const enPath = path.join(srcDir, 'i18n', 'en_US.json')
      const zhPath = path.join(srcDir, 'i18n', 'zh_CN.json')
      const [en, zh] = await Promise.all([
        fs.readFile(enPath, 'utf-8').catch(() => '{}'),
        fs.readFile(zhPath, 'utf-8').catch(() => '{}')
      ])
      i18n = { en_US: JSON.parse(en), zh_CN: JSON.parse(zh) }
    } catch {
      // keep defaults
    }

    // 3) Load utils from src/utils.js (very lightweight parser)
    const utils: any[] = []
    try {
      const utilsPath = path.join(srcDir, 'utils.js')
      const code = await fs.readFile(utilsPath, 'utf-8')
      const importRegex = /import\s+(?:{\s*([\w,\s]+)\s*}|([\w$]+))\s+from\s+['"]([^'"]+)['"]/g
      const imports: Array<{ local: string; source: string; destructuring: boolean }> = []
      let m: RegExpExecArray | null
      while ((m = importRegex.exec(code))) {
        const named = m[1]
        const def = m[2]
        const source = m[3]
        if (named) {
          named
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
            .forEach((n) => imports.push({ local: n, source, destructuring: true }))
        } else if (def) {
          imports.push({ local: def, source, destructuring: false })
        }
      }
      // exported names
      const exportRegex = /export\s*{([^}]+)}/
      const expMatch = code.match(exportRegex)
      const exported = expMatch
        ? expMatch[1]
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : []
      // Build utils array for exported imports; fallback for exported local functions/vars
      for (const name of exported) {
        const found = imports.find((imp) => imp.local === name)
        if (found) {
          utils.push({
            name,
            type: 'npm',
            content: {
              type: 'JSFunction',
              value: '',
              package: found.source,
              destructuring: found.destructuring,
              exportName: name
            }
          })
        } else {
          // treat as function utility placeholder
          utils.push({ name, type: 'function', content: { type: 'JSFunction', value: '' } })
        }
      }
    } catch {
      // ignore
    }

    // 4) Load dataSource from lowcodeConfig/dataSource.json
    const dataSource: any = { list: [] }
    try {
      const dsPath = path.join(srcDir, 'lowcodeConfig', 'dataSource.json')
      const dsRaw = await fs.readFile(dsPath, 'utf-8')
      const dsJson = JSON.parse(dsRaw)
      // pass through; keep shape as-is
      if (Array.isArray(dsJson.list)) dataSource.list = dsJson.list
    } catch {
      // ignore
    }

    // 5) Load globalState from src/stores/*.js (very light support for pinia defineStore)
    const globalState: any[] = []
    try {
      const storesDir = path.join(srcDir, 'stores')
      const storeFiles = await this.walk(storesDir, (p) => p.endsWith('.js'))
      for (const sf of storeFiles) {
        const code = await fs.readFile(sf, 'utf-8')
        // Skip files that don't define a Pinia store (e.g., re-export index.js)
        if (!/defineStore\s*\(/.test(code)) continue
        // naive extraction: id: 'xxx'
        const idMatch = code.match(/id:\s*['"]([^'"]+)['"]/)
        const stateMatch = code.match(/state:\s*\(\)\s*=>\s*\((\{[\s\S]*?\})\)/)
        const entry: any = { id: idMatch ? idMatch[1] : path.basename(sf, path.extname(sf)) }
        if (stateMatch) {
          try {
            // very naive: turn JS object to JSON by removing trailing commas and function values
            const objText = stateMatch[1]
            const stateObj = Function(`return (${objText})`)()
            entry.state = stateObj
          } catch {
            entry.state = {}
          }
        } else {
          // No state found, skip this file to avoid empty entries
          continue
        }
        // Only push when we have some keys in state (avoid empty {})
        if (entry.state && typeof entry.state === 'object' && Object.keys(entry.state).length > 0) {
          globalState.push(entry)
        }
      }
    } catch {
      // ignore
    }

    // 6) Assemble app schema
    const appSchema = generateAppSchema(pageSchemas, {
      i18n,
      utils,
      dataSource,
      globalState
    })

    return appSchema
  }

  setOptions(options: VueToSchemaOptions) {
    this.options = { ...this.options, ...options }
  }

  getOptions(): VueToSchemaOptions {
    return { ...this.options }
  }
}
