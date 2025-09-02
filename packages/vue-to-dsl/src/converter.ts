import { parseSFC } from './parser/index'
import { parseTemplate } from './parsers/templateParser'
import { parseScript } from './parsers/scriptParser'
import { parseStyle } from './parsers/styleParser'
import { generateSchema, generateAppSchema } from './generator/index'
import { defaultComponentMap } from './constants'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import JSZip from 'jszip'

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

    // 6) Read router info to enrich page meta (router path, isPage, isHome)
    try {
      const routerPath = path.join(srcDir, 'router', 'index.js')
      const rcode = await fs.readFile(routerPath, 'utf-8')
      // find root redirect name (home)
      // Simply capture the first redirect name (root level in this project)
      const homeMatch = rcode.match(/redirect:\s*\{\s*name:\s*['"]([^'"]+)['"]/)
      const homeName = homeMatch ? homeMatch[1] : ''

      // To avoid incorrectly pairing the redirect name with the first route's path/component,
      // remove the redirect object before extracting route entries.
      const rclean = rcode.replace(/redirect\s*:\s*\{[\s\S]*?\}/, '')

      const routeEntries: Array<{ routeName: string; routePath: string; importPath: string }> = []
      const routeRegex =
        /name:\s*['"]([^'"]+)['"][\s\S]*?path:\s*['"]([^'"]+)['"][\s\S]*?component:\s*\(\)\s*=>\s*import\(\s*['"]([^'"]+)['"]\s*\)/g
      let m: RegExpExecArray | null
      while ((m = routeRegex.exec(rclean))) {
        routeEntries.push({ routeName: m[1], routePath: m[2], importPath: m[3] })
      }
      // Build map by fileName (basename of the import .vue)
      const byFile: Record<string, { routeName: string; routePath: string; isHome: boolean }> = {}
      for (const e of routeEntries) {
        const base = path.basename(e.importPath).replace(/\.vue$/i, '')
        byFile[base] = { routeName: e.routeName, routePath: e.routePath, isHome: e.routeName === homeName }
      }
      // Enrich page schemas
      for (const ps of pageSchemas) {
        const fileName = ps?.fileName
        if (!fileName) continue
        const info = byFile[fileName]
        if (!info) continue
        ps.meta = ps.meta || {}
        ps.meta.router = info.routePath.startsWith('/') ? info.routePath.slice(1) : info.routePath
        ps.meta.isPage = true
        ps.meta.isHome = !!info.isHome
      }
    } catch {
      // ignore router enrichment failures
    }

    // 7) Assemble app schema
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

  // Convert an app from a zip buffer (in-memory). The buffer should be the content of the zip file (not a path).
  async convertAppFromZip(zipBuffer: ArrayBuffer | Uint8Array | Buffer): Promise<any> {
    // Browser-safe path: avoid fs/path/os, work fully in-memory
    if (typeof window !== 'undefined' && typeof (window as any).document !== 'undefined') {
      const zip = await JSZip.loadAsync(zipBuffer as any)

      // Collect file entries (posix paths in zip)
      const allFiles = Object.keys((zip as any).files || {})
        .filter((p) => !(zip as any).files[p].dir)
        .filter((p) => !p.startsWith('__MACOSX/'))

      // Determine root prefix (top-level folder)
      const topLevels = new Set(
        allFiles.map((p) => p.split('/')[0]).filter((seg) => !!seg && seg !== '.' && seg !== '..')
      )
      let rootPrefix = ''
      if (topLevels.size === 1) rootPrefix = [...topLevels][0] + '/'

      const joinRoot = (sub: string) => (rootPrefix ? rootPrefix + sub.replace(/^\/+/, '') : sub.replace(/^\/+/, ''))
      const readText = async (rel: string) => {
        const file = zip.file(rel)
        return file ? await file.async('string') : null
      }

      // 1) Pages: src/views/**/*.vue
      const viewPrefix = joinRoot('src/views/')
      const vueFiles = allFiles.filter((p) => p.startsWith(viewPrefix) && p.endsWith('.vue'))
      const pageSchemas: any[] = []
      for (const vf of vueFiles) {
        const code = await readText(vf)
        if (!code) continue
        const base = vf.split('/').pop() || 'Page.vue'
        const fileName = base.replace(/\.vue$/i, '')
        const res = await this.convertFromString(code, fileName)
        if (res.schema) pageSchemas.push(res.schema)
      }

      // 2) i18n
      let i18n: any = { en_US: {}, zh_CN: {} }
      try {
        const en = (await readText(joinRoot('src/i18n/en_US.json'))) || '{}'
        const zh = (await readText(joinRoot('src/i18n/zh_CN.json'))) || '{}'
        i18n = { en_US: JSON.parse(en), zh_CN: JSON.parse(zh) }
      } catch {
        // keep defaults
      }

      // 3) utils from src/utils.js
      const utils: any[] = []
      try {
        const code = await readText(joinRoot('src/utils.js'))
        if (code) {
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
          const exportRegex = /export\s*{([^}]+)}/
          const expMatch = code.match(exportRegex)
          const exported = expMatch
            ? expMatch[1]
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
            : []
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
              utils.push({ name, type: 'function', content: { type: 'JSFunction', value: '' } })
            }
          }
        }
      } catch {
        // ignore
      }

      // 4) dataSource
      const dataSource: any = { list: [] }
      try {
        const dsRaw = await readText(joinRoot('src/lowcodeConfig/dataSource.json'))
        if (dsRaw) {
          const dsJson = JSON.parse(dsRaw)
          if (Array.isArray(dsJson.list)) dataSource.list = dsJson.list
        }
      } catch {
        // ignore
      }

      // 5) globalState from src/stores/*.js
      const storesPrefix = joinRoot('src/stores/')
      const storeFiles = allFiles.filter((p) => p.startsWith(storesPrefix) && p.endsWith('.js'))
      const globalState: any[] = []
      for (const sf of storeFiles) {
        try {
          const code = await readText(sf)
          if (!code || !/defineStore\s*\(/.test(code)) continue
          const idMatch = code.match(/id:\s*['"]([^'"]+)['"]/)
          const stateMatch = code.match(/state:\s*\(\)\s*=>\s*\((\{[\s\S]*?\})\)/)
          const entry: any = { id: idMatch ? idMatch[1] : (sf.split('/').pop() || 'store').replace(/\.[^.]+$/, '') }
          if (stateMatch) {
            try {
              const objText = stateMatch[1]
              const stateObj = Function(`return (${objText})`)()
              entry.state = stateObj
            } catch {
              entry.state = {}
            }
          } else {
            continue
          }
          if (entry.state && typeof entry.state === 'object' && Object.keys(entry.state).length > 0) {
            globalState.push(entry)
          }
        } catch {
          // ignore
        }
      }

      // 6) router enrichment
      try {
        const rcode = await readText(joinRoot('src/router/index.js'))
        if (rcode) {
          const homeMatch = rcode.match(/redirect:\s*\{\s*name:\s*['"]([^'"]+)['"]/)
          const homeName = homeMatch ? homeMatch[1] : ''
          const rclean = rcode.replace(/redirect\s*:\s*\{[\s\S]*?\}/, '')
          const routeEntries: Array<{ routeName: string; routePath: string; importPath: string }> = []
          const routeRegex =
            /name:\s*['"]([^'"]+)['"][\s\S]*?path:\s*['"]([^'"]+)['"][\s\S]*?component:\s*\(\)\s*=>\s*import\(\s*['"]([^'"]+)['"]\s*\)/g
          let m: RegExpExecArray | null
          while ((m = routeRegex.exec(rclean)))
            routeEntries.push({ routeName: m[1], routePath: m[2], importPath: m[3] })
          const byFile: Record<string, { routeName: string; routePath: string; isHome: boolean }> = {}
          for (const e of routeEntries) {
            const base = (e.importPath.split('/').pop() || '').replace(/\.vue$/i, '')
            byFile[base] = { routeName: e.routeName, routePath: e.routePath, isHome: e.routeName === homeName }
          }
          for (const ps of pageSchemas) {
            const fileName = ps?.fileName
            if (!fileName) continue
            const info = byFile[fileName]
            if (!info) continue
            ps.meta = ps.meta || {}
            ps.meta.router = info.routePath.startsWith('/') ? info.routePath.slice(1) : info.routePath
            ps.meta.isPage = true
            ps.meta.isHome = !!info.isHome
          }
        }
      } catch {
        // ignore
      }

      // 7) Assemble app schema
      const appSchema = generateAppSchema(pageSchemas, {
        i18n,
        utils,
        dataSource,
        globalState
      })

      return appSchema
    }

    // Node.js path: unzip to temp and reuse directory-based converter
    // 1) Unzip into a temp directory
    const tmpBase = await fs.mkdtemp(path.join(os.tmpdir(), 'vue-to-dsl-'))
    const zip = await JSZip.loadAsync(zipBuffer as any)

    const fileEntries: string[] = []
    const writeTasks: Promise<any>[] = []
    zip.forEach((relPath, file) => {
      // Skip macOS metadata
      if (relPath.startsWith('__MACOSX/')) return
      const outPath = path.join(tmpBase, relPath)
      if (file.dir) {
        writeTasks.push(fs.mkdir(outPath, { recursive: true }))
      } else {
        fileEntries.push(relPath)
        writeTasks.push(
          (async () => {
            await fs.mkdir(path.dirname(outPath), { recursive: true })
            const content = await file.async('nodebuffer')
            await fs.writeFile(outPath, content)
          })()
        )
      }
    })
    await Promise.all(writeTasks)

    // 2) Determine the root app directory inside the zip
    const topLevels = new Set(
      fileEntries.map((p) => p.split('/')[0]).filter((seg) => !!seg && seg !== '.' && seg !== '..')
    )

    let appRoot = tmpBase
    if (topLevels.size === 1) {
      const only = [...topLevels][0]
      appRoot = path.join(tmpBase, only)
    }

    // 3) Delegate to convertAppDirectory
    const schema = await this.convertAppDirectory(appRoot)
    return schema
  }
}
