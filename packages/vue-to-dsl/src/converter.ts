import { parseSFC } from './parser/index'
import { parseTemplate } from './parsers/templateParser'
import { parseScript } from './parsers/scriptParser'
import { parseStyle } from './parsers/styleParser'
import { generateSchema, generateAppSchema } from './generator/index'
import { builtinSchemaComponents, defaultComponentsMap } from './constants'
import { createDefaultComponentMap, getSupportedSchemaComponents } from './materials.js'
import { parse as babelParse } from '@babel/parser'
import traverseModule from '@babel/traverse'
import * as t from '@babel/types'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import JSZip from 'jszip'

const traverse: any = (traverseModule as any)?.default ?? (traverseModule as any)

const HTML_TAGS = new Set([
  'div',
  'span',
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'a',
  'img',
  'button',
  'input',
  'form',
  'table',
  'tr',
  'td',
  'th',
  'thead',
  'tbody',
  'section',
  'article',
  'header',
  'footer',
  'nav',
  'aside',
  'main',
  'template',
  'slot'
])

function collectTemplateRefNames(nodes: any, collector = new Set<string>()) {
  if (!nodes) return collector

  if (Array.isArray(nodes)) {
    nodes.forEach((item) => collectTemplateRefNames(item, collector))
    return collector
  }

  if (typeof nodes !== 'object') return collector

  const refName = nodes?.props?.ref
  if (typeof refName === 'string' && refName.trim()) {
    collector.add(refName.trim())
  }

  Object.values(nodes).forEach((item) => {
    if (item && typeof item === 'object') {
      collectTemplateRefNames(item, collector)
    }
  })

  return collector
}

function replaceTemplateRefCode(code: string, refNames: Set<string>) {
  if (!code || !refNames.size) return code

  let nextCode = String(code)
  refNames.forEach((refName) => {
    const pattern = new RegExp(`\\bthis\\.state\\.${refName}\\b`, 'g')
    nextCode = nextCode.replace(pattern, `this.$('${refName}')`)
  })

  return nextCode
}

function normalizeSchemaTemplateRefs(schema: any, scriptSchema: any, templateSchema: any[]) {
  const refNames = collectTemplateRefNames(templateSchema)
  if (!refNames.size || !schema || typeof schema !== 'object') return schema

  const walk = (value: any) => {
    if (!value || typeof value !== 'object') return

    if (Array.isArray(value)) {
      value.forEach(walk)
      return
    }

    if ((value.type === 'JSExpression' || value.type === 'JSFunction') && typeof value.value === 'string') {
      value.value = replaceTemplateRefCode(value.value, refNames)
      return
    }

    if (value.accessor?.getter?.value) {
      value.accessor.getter.value = replaceTemplateRefCode(value.accessor.getter.value, refNames)
    }

    if (value.accessor?.setter?.value) {
      value.accessor.setter.value = replaceTemplateRefCode(value.accessor.setter.value, refNames)
    }

    Object.values(value).forEach((item) => walk(item))
  }

  walk(schema.methods)
  walk(schema.computed)
  walk(schema.lifeCycles)
  walk(schema.children)
  walk(schema.state)

  refNames.forEach((refName) => {
    if (
      scriptSchema?.state?.[refName]?.type === 'ref' &&
      schema.state &&
      Object.prototype.hasOwnProperty.call(schema.state, refName)
    ) {
      delete schema.state[refName]
    }
  })

  return schema
}

export interface VueToSchemaOptions {
  componentMap?: Record<string, string>
  materials?: any[] | Record<string, any>
  supportedComponents?: string[]
  preserveComments?: boolean
  strictMode?: boolean
  // 控制是否在出码结果中包含 computed 字段，默认 false
  computed_flag?: boolean
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
  scriptSchema?: any
  componentsMap?: any[]
}

type LocalModuleContext = {
  allFiles: string[]
  fileSet: Set<string>
  readText: (filePath: string) => Promise<string | null>
  readDataUrl: (filePath: string) => Promise<string | null>
}

type ImportedAssetEntry = {
  placeholder: string
  filePath: string
  name: string
  resourceData: string
}

export class VueToDslConverter {
  private options: VueToSchemaOptions

  private rawOptions: VueToSchemaOptions

  private static readonly NOOP_FUNCTION_VALUE = 'function noop() {}'

  constructor(options: VueToSchemaOptions = {}) {
    this.rawOptions = { ...options }
    this.options = this.normalizeOptions(this.rawOptions)
  }

  private normalizeOptions(options: VueToSchemaOptions = {}) {
    const normalizedOptions = {
      preserveComments: false,
      strictMode: false,
      computed_flag: false,
      customParsers: {},
      ...options
    }

    return {
      ...normalizedOptions,
      componentMap: normalizedOptions.componentMap || createDefaultComponentMap(normalizedOptions)
    }
  }

  private getSupportedSchemaComponents(options: VueToSchemaOptions = this.options) {
    return getSupportedSchemaComponents(options)
  }

  private isLocalModuleSource(source = '') {
    return source.startsWith('.') || source.startsWith('@/') || source.startsWith('/')
  }

  private stripQueryAndHash(source = '') {
    return String(source || '')
      .split('#')[0]
      .split('?')[0]
  }

  private getVirtualFileName(filePath = '') {
    const normalized = this.normalizeVirtualPath(filePath)
    const segments = normalized.split('/')
    return segments[segments.length - 1] || normalized
  }

  private getVirtualFileBaseName(filePath = '') {
    return this.getVirtualFileName(filePath).replace(/\.[^.]+$/, '')
  }

  private escapeRegExp(value = '') {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  private extractStringLiteralValue(code = '') {
    const trimmed = String(code || '').trim()
    const quote = trimmed[0]
    if (!trimmed || ![`'`, '"', '`'].includes(quote) || trimmed[trimmed.length - 1] !== quote) {
      return null
    }

    return trimmed.slice(1, -1)
  }

  private isImageAssetPath(filePath = '') {
    return /\.(png|jpe?g|gif|svg|webp|bmp|ico|avif)$/i.test(this.stripQueryAndHash(filePath))
  }

  private isLocalImageSource(source = '') {
    const normalized = String(source || '').trim()
    if (!normalized || !this.isImageAssetPath(normalized)) return false

    return (
      normalized.startsWith('./') ||
      normalized.startsWith('../') ||
      normalized.startsWith('@/') ||
      normalized.startsWith('/')
    )
  }

  private getMimeTypeByAssetPath(filePath = '') {
    const cleaned = this.stripQueryAndHash(filePath).toLowerCase()
    if (cleaned.endsWith('.png')) return 'image/png'
    if (cleaned.endsWith('.jpg') || cleaned.endsWith('.jpeg')) return 'image/jpeg'
    if (cleaned.endsWith('.gif')) return 'image/gif'
    if (cleaned.endsWith('.svg')) return 'image/svg+xml'
    if (cleaned.endsWith('.webp')) return 'image/webp'
    if (cleaned.endsWith('.bmp')) return 'image/bmp'
    if (cleaned.endsWith('.ico')) return 'image/x-icon'
    if (cleaned.endsWith('.avif')) return 'image/avif'

    return 'application/octet-stream'
  }

  private resolveLocalAssetPath(source: string, importerFile: string, context: LocalModuleContext) {
    if (!this.isLocalImageSource(source)) return null

    const cleanedSource = this.stripQueryAndHash(source)
    const normalizedSource = this.normalizeVirtualPath(cleanedSource)
    let candidates: string[] = []

    if (normalizedSource.startsWith('@/')) {
      candidates = [this.normalizeVirtualPath(`src/${normalizedSource.slice(2)}`)]
    } else if (normalizedSource.startsWith('/')) {
      const relativePath = normalizedSource.replace(/^\/+/, '')
      candidates = [relativePath, this.normalizeVirtualPath(`public/${relativePath}`)]
    } else {
      candidates = [this.resolveVirtualRelativePath(this.getVirtualDirname(importerFile), normalizedSource)]
    }

    const resolvedPath = candidates.find((item) => item && context.fileSet.has(item))
    return resolvedPath || null
  }

  private createImportedAssetPlaceholder(index: number) {
    return `__TE_IMPORTED_ASSET_${index}__`
  }

  private buildImportedAssetName(filePath = '') {
    return this.getVirtualFileName(filePath)
  }

  private async getOrCreateImportedAssetEntry(
    resolvedPath: string,
    context: LocalModuleContext,
    assetMap: Map<string, ImportedAssetEntry>
  ) {
    const normalizedPath = this.normalizeVirtualPath(resolvedPath)
    const existing = assetMap.get(normalizedPath)
    if (existing) return existing

    const resourceData = await context.readDataUrl(normalizedPath)
    if (!resourceData) return null

    const assetEntry: ImportedAssetEntry = {
      placeholder: this.createImportedAssetPlaceholder(assetMap.size + 1),
      filePath: normalizedPath,
      name: this.buildImportedAssetName(normalizedPath),
      resourceData
    }

    assetMap.set(normalizedPath, assetEntry)
    return assetEntry
  }

  private async replaceSchemaCssAssetUrls(
    cssText: string,
    importerFile: string,
    context: LocalModuleContext,
    assetMap: Map<string, ImportedAssetEntry>
  ) {
    const matches = Array.from(cssText.matchAll(/url\(\s*(['"]?)([^)'"]+)\1\s*\)/g))
    if (!matches.length) return cssText

    let output = cssText
    for (const match of matches) {
      const originalSource = String(match[2] || '').trim()
      const resolvedPath = this.resolveLocalAssetPath(originalSource, importerFile, context)
      if (!resolvedPath) continue

      const assetEntry = await this.getOrCreateImportedAssetEntry(resolvedPath, context, assetMap)
      if (!assetEntry) continue

      output = output.split(originalSource).join(assetEntry.placeholder)
    }

    return output
  }

  private async rewriteSchemaAssetReferences(
    target: any,
    importerFile: string,
    context: LocalModuleContext,
    assetMap: Map<string, ImportedAssetEntry>,
    localAssetImports = new Map<string, string>()
  ) {
    if (Array.isArray(target)) {
      for (const item of target) {
        await this.rewriteSchemaAssetReferences(item, importerFile, context, assetMap, localAssetImports)
      }
      return
    }

    if (!target || typeof target !== 'object') {
      return
    }

    if (typeof target.css === 'string') {
      target.css = await this.replaceSchemaCssAssetUrls(target.css, importerFile, context, assetMap)
    }

    for (const [key, value] of Object.entries(target)) {
      if (typeof value === 'string') {
        const resolvedPath = this.resolveLocalAssetPath(value, importerFile, context)
        if (resolvedPath) {
          const assetEntry = await this.getOrCreateImportedAssetEntry(resolvedPath, context, assetMap)
          if (assetEntry) {
            ;(target as any)[key] = assetEntry.placeholder
          }
        }
        continue
      }

      if (
        value &&
        typeof value === 'object' &&
        (value as any).type === 'JSExpression' &&
        typeof (value as any).value === 'string'
      ) {
        const nextExpression = String((value as any).value)
        const literalSource = this.extractStringLiteralValue(nextExpression)

        if (literalSource) {
          const resolvedPath = this.resolveLocalAssetPath(literalSource, importerFile, context)
          if (resolvedPath) {
            const assetEntry = await this.getOrCreateImportedAssetEntry(resolvedPath, context, assetMap)
            if (assetEntry) {
              ;(value as any).value = `'${assetEntry.placeholder}'`
            }
          }
        }

        for (const [localName, resolvedPath] of localAssetImports.entries()) {
          const assetEntry = await this.getOrCreateImportedAssetEntry(resolvedPath, context, assetMap)
          if (!assetEntry) continue

          const assetLiteral = `'${assetEntry.placeholder}'`
          const importRefPattern = new RegExp(`\\bthis\\.state\\.${this.escapeRegExp(localName)}\\b`, 'g')
          ;(value as any).value = String((value as any).value).replace(importRefPattern, assetLiteral)
        }
      }

      if (value && typeof value === 'object') {
        await this.rewriteSchemaAssetReferences(value, importerFile, context, assetMap, localAssetImports)
      }
    }
  }

  private collectLocalImageImports(scriptSchema: any, context: LocalModuleContext) {
    const importerFile = scriptSchema?.__filePath
    const importMap = new Map<string, string>()

    if (!importerFile || !Array.isArray(scriptSchema?.imports)) {
      return importMap
    }

    scriptSchema.imports.forEach((item: any) => {
      const resolvedPath = this.resolveLocalAssetPath(item?.source || '', importerFile, context)
      if (!resolvedPath) return
      ;(item.specifiers || []).forEach((spec: any) => {
        if (!spec?.local) return
        importMap.set(String(spec.local), resolvedPath)
      })
    })

    return importMap
  }

  private async collectImportedAssetsFromResults(results: ConvertResult[], context: LocalModuleContext) {
    const assetMap = new Map<string, ImportedAssetEntry>()

    for (const result of results) {
      const schema = result?.schema
      const importerFile = result?.scriptSchema?.__filePath || schema?.__sourceFilePath
      if (!schema || !importerFile) continue

      const localAssetImports = this.collectLocalImageImports(result?.scriptSchema, context)
      await this.rewriteSchemaAssetReferences(schema, importerFile, context, assetMap, localAssetImports)
    }

    return Array.from(assetMap.values())
  }

  private isSchemaBuiltinComponent(componentName = '') {
    if (!componentName) return true
    if (builtinSchemaComponents.has(componentName)) return true

    const lower = componentName.toLowerCase()
    if (HTML_TAGS.has(lower)) return true
    if (lower.includes('-') && !lower.startsWith('tiny-')) return true

    return false
  }

  private getComponentPackageVersion(source = '') {
    if (source === '@opentiny/vue' || source === '@opentiny/vue-icon') {
      return '^3.10.0'
    }
    return ''
  }

  private createPackageComponentMapEntry(
    componentName: string,
    source: string,
    exportName: string,
    destructuring = true
  ) {
    if (!componentName || !source || this.isLocalModuleSource(source)) return null

    const entry: any = {
      componentName,
      package: source,
      exportName: exportName || componentName,
      destructuring
    }

    const version = this.getComponentPackageVersion(source)
    if (version) {
      entry.version = version
    }

    return entry
  }

  private collectTemplateComponentNames(nodes: any[] = [], target = new Set<string>()) {
    const visited = new Set<any>()

    const walkAny = (value: any) => {
      if (!value || typeof value !== 'object') return
      if (visited.has(value)) return
      visited.add(value)

      if (Array.isArray(value)) {
        value.forEach((item) => walkAny(item))
        return
      }

      if (typeof value.componentName === 'string' && value.componentName) {
        target.add(value.componentName)
      }

      Object.values(value).forEach((item) => {
        if (item && typeof item === 'object') {
          walkAny(item)
        }
      })
    }

    nodes.forEach((node: any) => walkAny(node))
    return target
  }

  private buildComponentsMapFromTemplateAndScript(templateSchema: any[] = [], scriptSchema: any = {}) {
    const componentNames = [...this.collectTemplateComponentNames(templateSchema)]
    const defaultMapByName = new Map<string, any>()
    defaultComponentsMap.forEach((item: any) => {
      const componentName = String(item?.componentName || '')
      if (!componentName) return
      defaultMapByName.set(componentName, { ...item })
    })

    const importLookup = new Map<string, { source: string; imported: string; kind: string }>()
    ;(scriptSchema?.imports || []).forEach((imp: any) => {
      const source = String(imp?.source || '')
      ;(imp?.specifiers || []).forEach((spec: any) => {
        const local = String(spec?.local || '')
        if (!local) return

        importLookup.set(local, {
          source,
          imported: String(spec?.imported || local),
          kind: String(spec?.kind || 'named')
        })
      })
    })

    const iconFactoryLookup = new Map<string, string>()
    Object.entries(scriptSchema?.state || {}).forEach(([name, stateItem]: [string, any]) => {
      if (!/^TinyIcon[A-Z0-9]/.test(name)) return
      const rawValue = typeof stateItem?.value === 'string' ? stateItem.value.trim() : ''
      const match = rawValue.match(/^([A-Za-z_$][A-Za-z0-9_$]*)\(\)$/)
      if (match?.[1]) {
        iconFactoryLookup.set(name, match[1])
      }
    })

    const merged = new Map<string, any>()
    const addEntry = (entry: any) => {
      const name = String(entry?.componentName || '')
      if (!name || merged.has(name)) return
      merged.set(name, entry)
    }

    componentNames.forEach((componentName) => {
      if (this.isSchemaBuiltinComponent(componentName)) return

      const defaultEntry = defaultMapByName.get(componentName)
      if (defaultEntry) {
        addEntry(defaultEntry)
        return
      }

      const directImport = importLookup.get(componentName)
      if (
        directImport &&
        !this.isFrameworkImport(directImport.source) &&
        !this.isLocalModuleSource(directImport.source)
      ) {
        const exportName =
          directImport.imported === 'default' || directImport.imported === '*' ? componentName : directImport.imported
        const destructuring = directImport.kind === 'named'
        const entry = this.createPackageComponentMapEntry(componentName, directImport.source, exportName, destructuring)
        if (entry) {
          addEntry(entry)
          return
        }
      }

      if (/^TinyIcon[A-Z0-9]/.test(componentName)) {
        const inferredFactory = iconFactoryLookup.get(componentName) || `icon${componentName.slice('TinyIcon'.length)}`
        const iconImport = importLookup.get(inferredFactory)

        if (iconImport && iconImport.source === '@opentiny/vue-icon') {
          const exportName = iconImport.imported === 'default' ? inferredFactory : iconImport.imported
          const entry = this.createPackageComponentMapEntry(componentName, iconImport.source, exportName, true)
          if (entry) {
            addEntry(entry)
            return
          }
        }

        const iconEntry = this.createPackageComponentMapEntry(
          componentName,
          '@opentiny/vue-icon',
          inferredFactory,
          true
        )
        if (iconEntry) {
          addEntry(iconEntry)
          return
        }
      }

      if (/^Tiny[A-Z0-9]/.test(componentName)) {
        const tinyEntry = this.createPackageComponentMapEntry(
          componentName,
          '@opentiny/vue',
          componentName.replace(/^Tiny/, ''),
          true
        )
        if (tinyEntry) {
          addEntry(tinyEntry)
        }
      }
    })

    return [...merged.values()]
  }

  private mergeComponentsMaps(componentMaps: any[][] = []) {
    const merged = new Map<string, any>()

    componentMaps.flat().forEach((item: any) => {
      const componentName = String(item?.componentName || '')
      if (!componentName || merged.has(componentName)) return
      merged.set(componentName, { ...item })
    })

    return [...merged.values()]
  }

  private collectComponentsMapFromResults(results: ConvertResult[] = []) {
    const resultMaps = results
      .map((result: any) => (Array.isArray(result?.componentsMap) ? result.componentsMap : []))
      .filter((items) => items.length > 0)

    return this.mergeComponentsMaps([defaultComponentsMap as any[], ...resultMaps])
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

      if (sfcResult.template) {
        try {
          templateSchema = this.options.customParsers?.template
            ? this.options.customParsers.template.parse(sfcResult.template)
            : parseTemplate(sfcResult.template, {
                ...this.options,
                imports: scriptSchema.imports || [],
                props: scriptSchema.props || [],
                state: scriptSchema.state || {},
                methods: scriptSchema.methods || {},
                computed: scriptSchema.computed || {},
                runtimeAliases: scriptSchema.runtimeAliases || {}
              } as any)
        } catch (error: any) {
          errors.push(`Template parsing error: ${error.message}`)
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

      const schema = normalizeSchemaTemplateRefs(
        await generateSchema(templateSchema, scriptSchema, styleSchema, this.options as any),
        scriptSchema,
        templateSchema
      )
      const componentsMap = this.buildComponentsMapFromTemplateAndScript(templateSchema, scriptSchema)

      return {
        schema,
        dependencies: [...new Set(dependencies)],
        errors,
        warnings,
        scriptSchema,
        componentsMap
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

  private parseImportEntries(code: string) {
    const imports: Array<{ local: string; imported: string; source: string; destructuring: boolean }> = []
    const importRegex = /import\s+(?:\*\s+as\s+([\w$]+)|{\s*([^}]+)\s*}|([\w$]+))\s+from\s+['"]([^'"]+)['"]/g
    let match: RegExpExecArray | null

    while ((match = importRegex.exec(code))) {
      const namespaceLocal = match[1]
      const named = match[2]
      const defaultLocal = match[3]
      const source = match[4]

      if (namespaceLocal) {
        imports.push({ local: namespaceLocal, imported: '*', source, destructuring: false })
        continue
      }

      if (named) {
        named
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
          .forEach((item) => {
            const aliasMatch = item.match(/^([\w$]+)\s+as\s+([\w$]+)$/)
            const imported = aliasMatch ? aliasMatch[1] : item
            const local = aliasMatch ? aliasMatch[2] : item
            imports.push({ local, imported, source, destructuring: true })
          })
        continue
      }

      if (defaultLocal) {
        imports.push({ local: defaultLocal, imported: 'default', source, destructuring: false })
      }
    }

    return imports
  }

  private parseExportedNames(code: string) {
    const exported = new Map<string, string>()
    const exportListRegex = /export\s*{([^}]+)}/g
    let match: RegExpExecArray | null

    while ((match = exportListRegex.exec(code))) {
      match[1]
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .forEach((item) => {
          const aliasMatch = item.match(/^([\w$]+)\s+as\s+([\w$]+)$/)
          if (aliasMatch) exported.set(aliasMatch[2], aliasMatch[1])
          else exported.set(item, item)
        })
    }

    const directExportRegex = /export\s+(?:async\s+function|function|const|let|var|class)\s+([\w$]+)/g
    while ((match = directExportRegex.exec(code))) {
      exported.set(match[1], match[1])
    }

    return exported
  }

  private parseUtilsModule(code: string) {
    const utils: any[] = []
    const imports = this.parseImportEntries(code)
    const exported = this.parseExportedNames(code)

    for (const [exportedName, localName] of exported.entries()) {
      const found = imports.find((imp) => imp.local === localName)
      if (found) {
        utils.push({
          name: exportedName,
          type: 'npm',
          content: {
            type: 'JSFunction',
            value: VueToDslConverter.NOOP_FUNCTION_VALUE,
            package: found.source,
            destructuring: found.destructuring,
            exportName: found.imported === 'default' || found.imported === '*' ? found.local : found.imported
          }
        })
      } else {
        utils.push({
          name: exportedName,
          type: 'function',
          content: { type: 'JSFunction', value: VueToDslConverter.NOOP_FUNCTION_VALUE }
        })
      }
    }

    return utils
  }

  private getScriptCodeStrings(scriptSchema: any = {}) {
    const codeStrings: string[] = []

    ;['methods', 'computed', 'lifeCycles'].forEach((section) => {
      const entries = scriptSchema?.[section] || {}
      Object.values(entries).forEach((entry: any) => {
        if (typeof entry === 'string') codeStrings.push(entry)
        else if (entry?.value && typeof entry.value === 'string') codeStrings.push(entry.value)
      })
    })

    return codeStrings
  }

  private isImportUsed(localName: string, codeStrings: string[]) {
    if (!localName) return false
    const escaped = localName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = new RegExp(`\\b${escaped}\\b`)
    return codeStrings.some((code) => pattern.test(code))
  }

  private isFrameworkImport(source: string) {
    return ['vue', 'vue-i18n'].includes(source)
  }

  private isLocalUtilitySource(source: string) {
    return /(^|[\\/])utils(?:[/\\]index)?(?:\.[a-z]+)?$/i.test(source) || source === '@/utils'
  }

  private getNodeSource(node: any, source: string) {
    if (!node) return ''
    const start = node?.start
    const end = node?.end
    if (typeof start !== 'number' || typeof end !== 'number') return ''
    return source.slice(start, end)
  }

  private sanitizeModuleCodeFromNode(node: any, source: string) {
    const raw = this.getNodeSource(node, source)
    const baseStart = node?.start
    const baseEnd = node?.end
    if (!raw || typeof baseStart !== 'number' || typeof baseEnd !== 'number') return raw

    let wrappedNode: any
    if (t.isStatement(node)) {
      wrappedNode = node
    } else if (t.isExpression(node)) {
      wrappedNode = t.expressionStatement(node)
    } else {
      wrappedNode = t.functionDeclaration(t.identifier('__temp__'), [node as any], t.blockStatement([]))
    }

    const fileAst = t.file(t.program([wrappedNode]))
    const replacements: Array<{ start: number; end: number; text: string }> = []
    const seenRanges = new Set<string>()

    const pushReplacement = (start: number, end: number, text = '') => {
      if (start >= end) return
      const relativeStart = start - baseStart
      const relativeEnd = end - baseStart
      if (relativeStart < 0 || relativeEnd > raw.length) return
      const key = `${relativeStart}:${relativeEnd}:${text}`
      if (seenRanges.has(key)) return
      seenRanges.add(key)
      replacements.push({ start: relativeStart, end: relativeEnd, text })
    }

    traverse(fileAst as any, {
      TSTypeAnnotation(path: any) {
        pushReplacement(path.node.start, path.node.end)
      },
      TSTypeParameterInstantiation(path: any) {
        pushReplacement(path.node.start, path.node.end)
      },
      TSTypeParameterDeclaration(path: any) {
        pushReplacement(path.node.start, path.node.end)
      },
      TSAsExpression(path: any) {
        pushReplacement(path.node.expression.end, path.node.end)
      },
      TSTypeAssertion(path: any) {
        pushReplacement(path.node.start, path.node.expression.start)
      },
      TSNonNullExpression(path: any) {
        pushReplacement(path.node.expression.end, path.node.end)
      },
      TSInstantiationExpression(path: any) {
        pushReplacement(path.node.expression.end, path.node.end)
      },
      Identifier(path: any) {
        if (!path.node.optional) return
        const typeAnnotationStart = path.node.typeAnnotation?.start
        const optionalStart = path.node.start + String(path.node.name || '').length
        if (typeof typeAnnotationStart === 'number') {
          pushReplacement(optionalStart, typeAnnotationStart)
        } else {
          pushReplacement(optionalStart, optionalStart + 1)
        }
      },
      CallExpression(path: any) {
        const typeParameters = path.node.typeParameters || path.node.typeArguments
        if (typeParameters) pushReplacement(typeParameters.start, typeParameters.end)
      },
      NewExpression(path: any) {
        const typeParameters = path.node.typeParameters || path.node.typeArguments
        if (typeParameters) pushReplacement(typeParameters.start, typeParameters.end)
      }
    })

    return replacements
      .sort((a, b) => b.start - a.start || b.end - a.end)
      .reduce((output, item) => `${output.slice(0, item.start)}${item.text}${output.slice(item.end)}`, raw)
  }

  private normalizeVirtualPath(filePath = '') {
    return String(filePath || '')
      .replace(/\\/g, '/')
      .replace(/^\.\//, '')
      .replace(/\/+/g, '/')
      .replace(/\/$/, '')
  }

  private buildConflictResolvedFileName(
    relativePath: string,
    baseName: string,
    duplicatePaths: string[] = [],
    allPaths: string[] = []
  ) {
    const normalizeParts = (filePath: string) =>
      this.normalizeVirtualPath(filePath)
        .replace(/\.vue$/i, '')
        .split('/')
        .filter(Boolean)

    const toCamelCase = (parts: string[]) =>
      parts.map((part, index) => (index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1))).join('')

    const currentParts = normalizeParts(relativePath)
    const dirParts = currentParts.slice(0, -1)
    if (dirParts.length === 0) {
      return baseName
    }

    const normalizedAllPaths = allPaths.map((filePath) => this.normalizeVirtualPath(filePath))
    const normalizedDuplicates = duplicatePaths.map((filePath) => this.normalizeVirtualPath(filePath))
    const currentPath = this.normalizeVirtualPath(relativePath)
    const currentDir = dirParts.join('/')
    const isSinglePageFileInParent =
      normalizedAllPaths.filter((filePath) => {
        const parts = normalizeParts(filePath)
        return parts.slice(0, -1).join('/') === currentDir
      }).length === 1
    const buildName = (suffixParts: string[]) => {
      const prefix = toCamelCase(suffixParts)
      if (isSinglePageFileInParent) {
        return prefix
      }
      return `${prefix}${baseName.charAt(0).toUpperCase()}${baseName.slice(1)}`
    }

    for (let depth = 1; depth <= dirParts.length; depth++) {
      const currentSuffixParts = dirParts.slice(-depth)
      const currentSuffix = currentSuffixParts.join('/')
      const hasConflict = normalizedDuplicates.some((filePath) => {
        if (filePath === currentPath) return false
        const candidateDirParts = normalizeParts(filePath).slice(0, -1)
        return candidateDirParts.slice(-depth).join('/') === currentSuffix
      })

      if (!hasConflict) {
        return buildName(currentSuffixParts)
      }
    }

    return buildName(dirParts)
  }

  private getVirtualDirname(filePath = '') {
    const normalized = this.normalizeVirtualPath(filePath)
    const index = normalized.lastIndexOf('/')
    return index === -1 ? '' : normalized.slice(0, index)
  }

  private resolveVirtualRelativePath(baseDir: string, relativePath: string) {
    const normalizedBase = this.normalizeVirtualPath(baseDir)
    const normalizedRelative = this.normalizeVirtualPath(relativePath)
    const baseParts = normalizedBase ? normalizedBase.split('/') : []
    const nextParts = normalizedRelative.split('/')
    const output = normalizedRelative.startsWith('/') ? [] : [...baseParts]

    nextParts.forEach((part) => {
      if (!part || part === '.') return
      if (part === '..') {
        output.pop()
        return
      }
      output.push(part)
    })

    return output.join('/')
  }

  private resolveLocalModulePath(source: string, importerFile: string, context: LocalModuleContext) {
    if (!source || (!source.startsWith('.') && !source.startsWith('@/'))) return null

    const basePath = source.startsWith('@/')
      ? this.normalizeVirtualPath(`src/${source.slice(2)}`)
      : this.resolveVirtualRelativePath(this.getVirtualDirname(importerFile), source)

    const candidates = [basePath]
    const extensions = ['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs']

    extensions.forEach((ext) => {
      candidates.push(`${basePath}${ext}`)
    })

    extensions.forEach((ext) => {
      candidates.push(`${basePath}/index${ext}`)
    })

    const found = candidates.find((candidate) => context.fileSet.has(this.normalizeVirtualPath(candidate)))
    return found ? this.normalizeVirtualPath(found) : null
  }

  private createEmptyFunctionUtilEntry(name: string) {
    return {
      name,
      type: 'function',
      content: {
        type: 'JSFunction',
        value: VueToDslConverter.NOOP_FUNCTION_VALUE
      }
    }
  }

  private cloneUtilEntry(item: any, name = item?.name) {
    return {
      ...item,
      name,
      content: item?.content ? { ...item.content } : item?.content
    }
  }

  private createNpmUtilEntry(
    name: string,
    source: string,
    imported: string,
    options: { destructuring?: boolean; exportName?: string } = {}
  ) {
    return {
      name,
      type: 'npm',
      content: {
        type: 'JSFunction',
        value: VueToDslConverter.NOOP_FUNCTION_VALUE,
        package: source,
        destructuring: options.destructuring ?? (imported !== 'default' && imported !== '*'),
        exportName: options.exportName || (imported === 'default' || imported === '*' ? name : imported || name)
      }
    }
  }

  private createDeclaredUtilEntry(name: string, node: any, sourceCode: string) {
    if (
      t.isFunctionDeclaration(node) ||
      t.isFunctionExpression(node) ||
      t.isArrowFunctionExpression(node) ||
      t.isClassDeclaration(node) ||
      t.isClassExpression(node)
    ) {
      return {
        name,
        type: 'function',
        content: {
          type: 'JSFunction',
          value: this.sanitizeModuleCodeFromNode(node, sourceCode)
        }
      }
    }

    return this.createEmptyFunctionUtilEntry(name)
  }

  private getModuleExportName(node: any, fallback = '') {
    if (t.isIdentifier(node)) return node.name
    if (t.isStringLiteral(node)) return node.value
    return fallback
  }

  private async collectModuleUtilExports(
    modulePath: string,
    context: LocalModuleContext,
    cache = new Map<string, Map<string, any>>()
  ) {
    const normalizedPath = this.normalizeVirtualPath(modulePath)

    if (cache.has(normalizedPath)) {
      return cache.get(normalizedPath)!
    }

    const exportsMap = new Map<string, any>()
    cache.set(normalizedPath, exportsMap)

    const code = await context.readText(normalizedPath)
    if (!code) return exportsMap

    let ast: any
    try {
      ast = babelParse(code, { sourceType: 'module', plugins: ['typescript', 'jsx'] })
    } catch {
      this.parseUtilsModule(code).forEach((item) => exportsMap.set(item.name, item))
      return exportsMap
    }

    const importsByLocal = new Map<string, any>()
    const declaredUtils = new Map<string, any>()

    const resolveImportedUtil = async (importInfo: any, exportedName: string) => {
      if (!importInfo?.source) return null

      if (this.isFrameworkImport(importInfo.source) || /\.vue$/i.test(importInfo.source)) {
        return null
      }

      if (importInfo.source.startsWith('.') || importInfo.source.startsWith('@/')) {
        const targetPath = this.resolveLocalModulePath(importInfo.source, normalizedPath, context)
        if (!targetPath) return null
        const targetExports = await this.collectModuleUtilExports(targetPath, context, cache)
        const target =
          targetExports.get(exportedName) || (exportedName === 'default' ? targetExports.get('default') : null)
        return target ? this.cloneUtilEntry(target) : null
      }

      return this.createNpmUtilEntry(exportedName, importInfo.source, importInfo.imported || exportedName, {
        destructuring: importInfo.kind === 'named',
        exportName:
          importInfo.kind === 'named'
            ? importInfo.imported || exportedName
            : importInfo.kind === 'namespace'
            ? importInfo.local
            : importInfo.local
      })
    }

    const collectDeclaredVariables = (declaration: any, targetMap: Map<string, any>, shouldExport = false) => {
      declaration.declarations.forEach((item: any) => {
        if (!t.isIdentifier(item.id)) return
        const utilEntry = this.createDeclaredUtilEntry(item.id.name, item.init, code)
        targetMap.set(item.id.name, utilEntry)
        if (shouldExport) exportsMap.set(item.id.name, this.cloneUtilEntry(utilEntry))
      })
    }

    for (const statement of ast.program.body) {
      if (t.isImportDeclaration(statement)) {
        statement.specifiers.forEach((spec: any) => {
          if (t.isImportSpecifier(spec)) {
            importsByLocal.set(spec.local.name, {
              source: statement.source.value,
              local: spec.local.name,
              imported: t.isIdentifier(spec.imported) ? spec.imported.name : spec.imported.value,
              kind: 'named'
            })
            return
          }

          if (t.isImportNamespaceSpecifier(spec)) {
            importsByLocal.set(spec.local.name, {
              source: statement.source.value,
              local: spec.local.name,
              imported: '*',
              kind: 'namespace'
            })
            return
          }

          importsByLocal.set(spec.local.name, {
            source: statement.source.value,
            local: spec.local.name,
            imported: 'default',
            kind: 'default'
          })
        })
        continue
      }

      if (t.isFunctionDeclaration(statement) && statement.id) {
        declaredUtils.set(statement.id.name, this.createDeclaredUtilEntry(statement.id.name, statement, code))
        continue
      }

      if (t.isClassDeclaration(statement) && statement.id) {
        declaredUtils.set(statement.id.name, this.createDeclaredUtilEntry(statement.id.name, statement, code))
        continue
      }

      if (t.isVariableDeclaration(statement)) {
        collectDeclaredVariables(statement, declaredUtils)
        continue
      }

      if (t.isExportNamedDeclaration(statement)) {
        if (statement.declaration) {
          if (t.isFunctionDeclaration(statement.declaration) && statement.declaration.id) {
            const utilEntry = this.createDeclaredUtilEntry(statement.declaration.id.name, statement.declaration, code)
            declaredUtils.set(statement.declaration.id.name, utilEntry)
            exportsMap.set(statement.declaration.id.name, this.cloneUtilEntry(utilEntry))
            continue
          }

          if (t.isClassDeclaration(statement.declaration) && statement.declaration.id) {
            const utilEntry = this.createDeclaredUtilEntry(statement.declaration.id.name, statement.declaration, code)
            declaredUtils.set(statement.declaration.id.name, utilEntry)
            exportsMap.set(statement.declaration.id.name, this.cloneUtilEntry(utilEntry))
            continue
          }

          if (t.isVariableDeclaration(statement.declaration)) {
            collectDeclaredVariables(statement.declaration, declaredUtils, true)
            continue
          }
        }

        if (statement.source) {
          for (const specifier of statement.specifiers) {
            if (!t.isExportSpecifier(specifier)) continue
            const importedName = this.getModuleExportName(specifier.local)
            const exportedName = this.getModuleExportName(specifier.exported, importedName)
            const importInfo = {
              source: statement.source.value,
              imported: importedName,
              local: importedName,
              kind: importedName === 'default' ? 'default' : 'named'
            }
            const utilEntry = await resolveImportedUtil(importInfo, importedName)
            if (utilEntry) exportsMap.set(exportedName, this.cloneUtilEntry(utilEntry, exportedName))
          }
          continue
        }

        for (const specifier of statement.specifiers) {
          if (!t.isExportSpecifier(specifier)) continue
          const localName = this.getModuleExportName(specifier.local)
          const exportedName = this.getModuleExportName(specifier.exported, localName)

          if (declaredUtils.has(localName)) {
            exportsMap.set(exportedName, this.cloneUtilEntry(declaredUtils.get(localName), exportedName))
            continue
          }

          if (importsByLocal.has(localName)) {
            const utilEntry = await resolveImportedUtil(
              importsByLocal.get(localName),
              importsByLocal.get(localName).imported
            )
            if (utilEntry) {
              exportsMap.set(exportedName, this.cloneUtilEntry(utilEntry, exportedName))
            } else {
              exportsMap.set(exportedName, this.createEmptyFunctionUtilEntry(exportedName))
            }
          }
        }

        continue
      }

      if (t.isExportAllDeclaration(statement)) {
        if (!statement.source) continue
        const importInfo = { source: statement.source.value, imported: '*', local: '*', kind: 'namespace' }
        const targetPath = this.resolveLocalModulePath(importInfo.source, normalizedPath, context)
        if (!targetPath) continue
        const targetExports = await this.collectModuleUtilExports(targetPath, context, cache)
        targetExports.forEach((item, exportName) => {
          if (exportName === 'default') return
          exportsMap.set(exportName, this.cloneUtilEntry(item, exportName))
        })
        continue
      }

      if (t.isExportDefaultDeclaration(statement)) {
        const declaration = statement.declaration

        if (
          t.isFunctionDeclaration(declaration) ||
          t.isFunctionExpression(declaration) ||
          t.isArrowFunctionExpression(declaration) ||
          t.isClassDeclaration(declaration) ||
          t.isClassExpression(declaration)
        ) {
          exportsMap.set('default', this.createDeclaredUtilEntry('default', declaration, code))
          continue
        }

        if (t.isIdentifier(declaration)) {
          if (declaredUtils.has(declaration.name)) {
            exportsMap.set('default', this.cloneUtilEntry(declaredUtils.get(declaration.name), 'default'))
            continue
          }

          if (importsByLocal.has(declaration.name)) {
            const utilEntry = await resolveImportedUtil(
              importsByLocal.get(declaration.name),
              importsByLocal.get(declaration.name).imported
            )
            if (utilEntry) exportsMap.set('default', this.cloneUtilEntry(utilEntry, 'default'))
          }
        }
      }
    }

    return exportsMap
  }

  private async collectRootUtils(context: LocalModuleContext) {
    const entryCandidates = [
      'src/utils.js',
      'src/utils.ts',
      'src/utils.jsx',
      'src/utils.tsx',
      'src/utils.mjs',
      'src/utils.cjs',
      'src/utils/index.js',
      'src/utils/index.ts',
      'src/utils/index.jsx',
      'src/utils/index.tsx',
      'src/utils/index.mjs',
      'src/utils/index.cjs'
    ]

    const cache = new Map<string, Map<string, any>>()
    const utils: any[] = []

    for (const candidate of entryCandidates) {
      if (!context.fileSet.has(candidate)) continue
      const exportsMap = await this.collectModuleUtilExports(candidate, context, cache)
      exportsMap.forEach((item, exportName) => {
        if (exportName === 'default') return
        utils.push(this.cloneUtilEntry(item, exportName))
      })
    }

    return this.mergeUtils([], utils)
  }

  private resolveLocalVueFilePath(source: string, importerFile: string, context: LocalModuleContext) {
    if (!source || (!source.startsWith('.') && !source.startsWith('@/'))) return null

    const basePath = source.startsWith('@/')
      ? this.normalizeVirtualPath(`src/${source.slice(2)}`)
      : this.resolveVirtualRelativePath(this.getVirtualDirname(importerFile), source)

    const candidates = [basePath]

    if (!/\.vue$/i.test(basePath)) {
      candidates.push(`${basePath}.vue`)
      candidates.push(`${basePath}/index.vue`)
    }

    const found = candidates.find((candidate) => context.fileSet.has(this.normalizeVirtualPath(candidate)))
    return found ? this.normalizeVirtualPath(found) : null
  }

  private collectBlockComponentNames(schema: any) {
    const names = new Set<string>()
    const supportedComponents = this.getSupportedSchemaComponents()

    const visit = (node: any) => {
      if (!node || typeof node !== 'object') return
      if (node.componentType === 'Block' && node.componentName && !supportedComponents.has(node.componentName)) {
        names.add(String(node.componentName))
      }
      if (Array.isArray(node.children)) {
        node.children.forEach(visit)
      }
    }

    if (Array.isArray(schema?.children)) {
      schema.children.forEach(visit)
    }

    return names
  }

  private getReferencedLocalVueImports(result: ConvertResult, context: LocalModuleContext) {
    const refs: Array<{ filePath: string; componentName: string }> = []
    const schema = result?.schema
    const scriptSchema: any = result?.scriptSchema

    if (!schema || !scriptSchema?.imports?.length || !scriptSchema?.__filePath) {
      return refs
    }

    const usedBlockNames = this.collectBlockComponentNames(schema)

    scriptSchema.imports.forEach((imp: any) => {
      ;(imp.specifiers || []).forEach((spec: any) => {
        if (!spec?.local || !usedBlockNames.has(String(spec.local))) return

        const targetPath = this.resolveLocalVueFilePath(imp.source, scriptSchema.__filePath, context)
        if (!targetPath) return

        refs.push({
          filePath: targetPath,
          componentName: String(spec.local)
        })
      })
    })

    return refs
  }

  private async collectImportedVueBlocks(
    results: ConvertResult[],
    context: LocalModuleContext,
    baseBlockSchemas: any[] = []
  ) {
    const blockSchemas = [...baseBlockSchemas]
    const blockResults: ConvertResult[] = []
    const blockedViewPaths = new Set<string>()
    const existingBlockNames = new Set(
      blockSchemas.map((item) => String(item?.fileName || item?.meta?.name || '')).filter(Boolean)
    )
    const processedPaths = new Set<string>()
    const queue = results.flatMap((result) => this.getReferencedLocalVueImports(result, context))

    while (queue.length) {
      const current = queue.shift()
      if (!current) continue

      const filePath = this.normalizeVirtualPath(current.filePath)
      if (processedPaths.has(filePath)) continue
      processedPaths.add(filePath)

      const code = await context.readText(filePath)
      if (!code) continue

      const savedOptions = { ...this.options }
      try {
        this.options = { ...this.options, isBlock: true } as any
        const result = await this.convertFromString(code, current.componentName)
        if (result.scriptSchema) {
          result.scriptSchema.__filePath = filePath
        }
        if (result.schema) {
          result.schema.componentName = 'Block'
          result.schema.fileName = current.componentName
          result.schema.meta = { ...(result.schema.meta || {}), name: current.componentName }
          ;(result.schema as any).__sourceFilePath = filePath

          if (!existingBlockNames.has(current.componentName)) {
            existingBlockNames.add(current.componentName)
            blockSchemas.push(result.schema)
          }
        }

        blockResults.push(result)

        if (filePath.startsWith('src/views/')) {
          blockedViewPaths.add(filePath)
        }

        queue.push(...this.getReferencedLocalVueImports(result, context))
      } finally {
        this.options = savedOptions
      }
    }

    return {
      blockSchemas,
      blockResults,
      blockedViewPaths
    }
  }

  private async collectRouterEntriesFromModuleContext(context: LocalModuleContext) {
    const rcode = await context.readText('src/router/index.js')
    if (!rcode) {
      throw new Error('router file not found')
    }

    const homeMatch = rcode.match(/redirect:\s*\{\s*name:\s*['"]([^'"]+)['"]/)
    const homeName = homeMatch ? homeMatch[1] : ''
    const rclean = rcode.replace(/redirect\s*:\s*\{[\s\S]*?\}/, '')
    const routeEntries: Array<{
      routeName: string
      routePath: string
      importPath: string
      isHome: boolean
      resolvedFilePath: string | null
    }> = []
    const routeRegex =
      /name:\s*['"]([^'"]+)['"][\s\S]*?path:\s*['"]([^'"]+)['"][\s\S]*?component:\s*\(\)\s*=>\s*import\(\s*['"]([^'"]+)['"]\s*\)/g
    let match: RegExpExecArray | null

    while ((match = routeRegex.exec(rclean))) {
      const importPath = match[3]
      routeEntries.push({
        routeName: match[1],
        routePath: match[2],
        importPath,
        isHome: match[1] === homeName,
        resolvedFilePath: this.resolveLocalVueFilePath(importPath, 'src/router/index.js', context)
      })
    }

    return routeEntries
  }

  private async collectRoutedViewPathsFromModuleContext(context: LocalModuleContext) {
    const routeEntries = await this.collectRouterEntriesFromModuleContext(context)
    return new Set(routeEntries.map((item) => item.resolvedFilePath).filter((item): item is string => !!item))
  }

  private async createImportedUtilEntry(
    spec: {
      local: string
      imported: string
      source: string
      destructuring: boolean
      kind?: string
      importerFile?: string
    },
    knownUtilsByName: Map<string, any>,
    context?: LocalModuleContext,
    cache?: Map<string, Map<string, any>>
  ) {
    if (this.isFrameworkImport(spec.source)) return null
    if (/\.vue$/i.test(spec.source)) return null

    if (context && spec.importerFile && (spec.source.startsWith('.') || spec.source.startsWith('@/'))) {
      const targetPath = this.resolveLocalModulePath(spec.source, spec.importerFile, context)
      if (targetPath) {
        const targetExports = await this.collectModuleUtilExports(targetPath, context, cache)
        const target =
          targetExports.get(spec.imported) || (spec.imported === 'default' ? targetExports.get('default') : null)
        if (target) {
          return this.cloneUtilEntry(target, spec.local)
        }
      }
    }

    if (this.isLocalUtilitySource(spec.source)) {
      const known = knownUtilsByName.get(spec.imported) || knownUtilsByName.get(spec.local)
      if (known) {
        return {
          ...known,
          name: spec.local,
          content: {
            ...(known.content || {}),
            exportName:
              known.type === 'npm'
                ? spec.imported === 'default' || spec.imported === '*'
                  ? known.content?.exportName || spec.local
                  : spec.imported
                : known.content?.exportName
          }
        }
      }
    }

    if (spec.source.startsWith('.') || spec.source.startsWith('@/')) {
      return this.createEmptyFunctionUtilEntry(spec.local)
    }

    return this.createNpmUtilEntry(spec.local, spec.source, spec.imported, { destructuring: spec.destructuring })
  }

  private mergeUtils(existing: any[], incoming: any[]) {
    const merged = [...existing]
    const knownNames = new Set(existing.map((item) => item?.name).filter(Boolean))

    incoming.forEach((item) => {
      if (!item?.name || knownNames.has(item.name)) return
      knownNames.add(item.name)
      merged.push(item)
    })

    return merged
  }

  private async enrichUtilsFromScriptResults(results: ConvertResult[], baseUtils: any[], context?: LocalModuleContext) {
    const knownUtilsByName = new Map(baseUtils.map((item) => [item.name, item]))
    const discovered: any[] = []
    const cache = new Map<string, Map<string, any>>()

    for (const result of results as any[]) {
      const scriptSchema = result?.scriptSchema
      if (!scriptSchema?.imports?.length) continue

      const usedImports =
        Array.isArray(scriptSchema?.usedUtilsImports) && scriptSchema.usedUtilsImports.length
          ? scriptSchema.usedUtilsImports
          : scriptSchema.imports.flatMap((imp: any) => {
              const codeStrings = this.getScriptCodeStrings(scriptSchema)
              return (imp.specifiers || [])
                .filter((spec: any) => spec?.local && this.isImportUsed(spec.local, codeStrings))
                .map((spec: any) => ({
                  local: spec.local,
                  imported: spec.imported || 'default',
                  source: imp.source,
                  kind: spec.kind || (spec.imported === 'default' ? 'default' : 'named')
                }))
            })

      for (const usedImport of usedImports) {
        const utilEntry = await this.createImportedUtilEntry(
          {
            local: usedImport.local,
            imported: usedImport.imported || 'default',
            source: usedImport.source,
            destructuring:
              usedImport.kind === 'named' || (usedImport.imported !== 'default' && usedImport.imported !== '*'),
            kind: usedImport.kind,
            importerFile: scriptSchema.__filePath
          },
          knownUtilsByName,
          context,
          cache
        )
        if (utilEntry) {
          discovered.push(utilEntry)
          knownUtilsByName.set(utilEntry.name, utilEntry)
        }
      }
    }

    return this.mergeUtils(baseUtils, discovered)
  }

  private getViewVueFiles(context: LocalModuleContext) {
    return context.allFiles
      .map((filePath) => this.normalizeVirtualPath(filePath))
      .filter((filePath) => filePath.startsWith('src/views/') && filePath.endsWith('.vue'))
  }

  private async collectPageResultsFromModuleContext(context: LocalModuleContext) {
    const vueFiles = this.getViewVueFiles(context)
    const relativeViewPaths = vueFiles.map((filePath) => filePath.slice('src/views/'.length))

    const fileMap = new Map<string, string[]>()
    relativeViewPaths.forEach((relativePath) => {
      const baseName =
        relativePath
          .split('/')
          .pop()
          ?.replace(/\.vue$/i, '') || ''
      if (!fileMap.has(baseName)) {
        fileMap.set(baseName, [])
      }
      fileMap.get(baseName)!.push(relativePath)
    })

    const needsSpecialNaming = new Set<string>()
    for (const paths of fileMap.values()) {
      if (paths.length > 1) {
        paths.forEach((item) => needsSpecialNaming.add(item))
      }
    }

    const pageResults: ConvertResult[] = []
    for (const filePath of vueFiles) {
      const relativePath = filePath.slice('src/views/'.length)
      const baseName =
        relativePath
          .split('/')
          .pop()
          ?.replace(/\.vue$/i, '') || 'Page'

      try {
        const vueCode = await context.readText(filePath)
        if (!vueCode) {
          pageResults.push({
            schema: null,
            dependencies: [],
            errors: [`Failed to read ${filePath}`],
            warnings: []
          })
          continue
        }

        const fileName = needsSpecialNaming.has(relativePath)
          ? this.buildConflictResolvedFileName(relativePath, baseName, fileMap.get(baseName) || [], relativeViewPaths)
          : baseName

        const result = await this.convertFromString(vueCode, fileName)
        if (result.scriptSchema) {
          result.scriptSchema.__filePath = filePath
        }
        pageResults.push(result)
      } catch (error: any) {
        pageResults.push({
          schema: null,
          dependencies: [],
          errors: [`Failed to convert ${filePath}: ${error.message}`],
          warnings: []
        })
      }
    }

    return pageResults
  }

  private async collectAppI18nFromModuleContext(context: LocalModuleContext) {
    try {
      const [en, zh] = await Promise.all([
        context.readText('src/i18n/en_US.json').then((content) => content || '{}'),
        context.readText('src/i18n/zh_CN.json').then((content) => content || '{}')
      ])

      return { en_US: JSON.parse(en), zh_CN: JSON.parse(zh) }
    } catch {
      return { en_US: {}, zh_CN: {} }
    }
  }

  private async collectDataSourceFromModuleContext(context: LocalModuleContext) {
    const dataSource: any = { list: [] }

    try {
      const raw = await context.readText('src/lowcodeConfig/dataSource.json')
      if (!raw) return dataSource

      const json = JSON.parse(raw)
      if (Array.isArray(json.list)) dataSource.list = json.list
    } catch {
      // ignore
    }

    return dataSource
  }

  private async collectGlobalStateFromModuleContext(context: LocalModuleContext) {
    const globalState: any[] = []
    const storeFiles = context.allFiles
      .map((filePath) => this.normalizeVirtualPath(filePath))
      .filter((filePath) => filePath.startsWith('src/stores/') && filePath.endsWith('.js'))

    for (const filePath of storeFiles) {
      try {
        const code = await context.readText(filePath)
        if (!code || !/defineStore\s*\(/.test(code)) continue

        const idMatch = code.match(/id:\s*['"]([^'"]+)['"]/)
        const stateMatch = code.match(/state:\s*\(\)\s*=>\s*\((\{[\s\S]*?\})\)/)
        const fallbackId =
          filePath
            .split('/')
            .pop()
            ?.replace(/\.[^.]+$/, '') || 'store'
        const entry: any = { id: idMatch ? idMatch[1] : fallbackId }

        if (stateMatch) {
          try {
            const objText = stateMatch[1]
            entry.state = Function(`return (${objText})`)()
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

    return globalState
  }

  private async enrichPageSchemasWithRouterFromModuleContext(pageSchemas: any[], context: LocalModuleContext) {
    try {
      const routeEntries = await this.collectRouterEntriesFromModuleContext(context)

      const byFile: Record<string, { routeName: string; routePath: string; isHome: boolean }> = {}
      routeEntries.forEach((item) => {
        const base =
          item.importPath
            .split('/')
            .pop()
            ?.replace(/\.vue$/i, '') || ''
        if (!base) return
        byFile[base] = { routeName: item.routeName, routePath: item.routePath, isHome: item.isHome }
      })

      for (const pageSchema of pageSchemas) {
        const fileName = pageSchema?.fileName
        if (!fileName) continue

        let info = byFile[fileName]
        if (!info) {
          for (const [base, routeInfo] of Object.entries(byFile)) {
            if (fileName.toLowerCase() === base.toLowerCase()) {
              info = routeInfo
              break
            }
            if (fileName.endsWith(base.charAt(0).toUpperCase() + base.slice(1))) {
              info = routeInfo
              break
            }
          }
        }

        pageSchema.meta = pageSchema.meta || {}
        if (info) {
          const routerPath = info.routePath.startsWith('/') ? info.routePath.slice(1) : info.routePath
          pageSchema.meta.router = routerPath
          pageSchema.meta.isPage = true
          pageSchema.meta.isHome = !!info.isHome
        } else {
          pageSchema.meta.router = fileName.toLowerCase()
          pageSchema.meta.isPage = true
        }
      }
    } catch {
      for (const pageSchema of pageSchemas) {
        pageSchema.meta = pageSchema.meta || {}
        if (!pageSchema.meta.router) {
          pageSchema.meta.router = (pageSchema.fileName || 'page').toLowerCase()
          pageSchema.meta.isPage = true
        }
      }
    }
  }

  private async buildAppSchemaFromModuleContext(context: LocalModuleContext) {
    const pageResults = await this.collectPageResultsFromModuleContext(context)
    const allResults: ConvertResult[] = [...pageResults]
    const i18n = await this.collectAppI18nFromModuleContext(context)
    let utils: any[] = await this.collectRootUtils(context)
    const dataSource = await this.collectDataSourceFromModuleContext(context)
    const globalState = await this.collectGlobalStateFromModuleContext(context)

    let blockSchemas: any[] = []
    const importedVueBlockData = await this.collectImportedVueBlocks(pageResults, context, blockSchemas)
    blockSchemas = importedVueBlockData.blockSchemas
    allResults.push(...importedVueBlockData.blockResults)
    const assets = await this.collectImportedAssetsFromResults(allResults, context)
    const routedViewPaths = await this.collectRoutedViewPathsFromModuleContext(context).catch(() => null)

    const pageSchemas = pageResults
      .filter((result: any) => {
        if (!result?.schema) return false

        const filePath = result?.scriptSchema?.__filePath || ''
        if (!importedVueBlockData.blockedViewPaths.has(filePath)) return true

        return routedViewPaths?.has(filePath) || false
      })
      .map((result) => result.schema)
      .filter(Boolean)

    await this.enrichPageSchemasWithRouterFromModuleContext(pageSchemas, context)
    utils = await this.enrichUtilsFromScriptResults(allResults, utils, context)
    const componentsMap = this.collectComponentsMapFromResults(allResults)

    return generateAppSchema(pageSchemas, {
      i18n,
      utils,
      assets,
      dataSource,
      globalState,
      blockSchemas,
      componentsMap
    })
  }

  private async createModuleContextFromAppDirectory(appDir: string): Promise<LocalModuleContext> {
    const appFiles = (await this.walk(appDir, (_p) => true)).map((filePath) =>
      this.normalizeVirtualPath(path.relative(appDir, filePath))
    )

    return {
      allFiles: appFiles,
      fileSet: new Set(appFiles),
      readText: async (filePath: string) => {
        try {
          return await fs.readFile(path.join(appDir, ...this.normalizeVirtualPath(filePath).split('/')), 'utf-8')
        } catch {
          return null
        }
      },
      readDataUrl: async (filePath: string) => {
        try {
          const normalizedPath = this.normalizeVirtualPath(filePath)
          const fileBuffer = await fs.readFile(path.join(appDir, ...normalizedPath.split('/')))
          const mimeType = this.getMimeTypeByAssetPath(normalizedPath)

          return `data:${mimeType};base64,${fileBuffer.toString('base64')}`
        } catch {
          return null
        }
      }
    }
  }

  private createGitignoreFilter(gitignoreContent: string) {
    const lines = gitignoreContent
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))

    const patterns = lines.map((line) => {
      const isNegative = line.startsWith('!')
      const pattern = isNegative ? line.slice(1) : line
      const regexString = pattern
        .replace(/([.+?^${}()|[\]\\])/g, '\\$1')
        .replace(/\/\*\*$/, '/.*')
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^/]*')
        .replace(/\?/g, '[^/]')

      if (regexString.endsWith('/')) {
        return { regex: new RegExp(`^${regexString}`), isNegative }
      }

      return { regex: new RegExp(`^${regexString}(/.*)?$`), isNegative }
    })

    return (targetPath: string) => {
      let isIgnored = false
      for (const { regex, isNegative } of patterns) {
        if (regex.test(targetPath)) {
          isIgnored = !isNegative
        }
      }
      return !isIgnored
    }
  }

  private async createModuleContextFromBrowserZip(
    zipBuffer: ArrayBuffer | Uint8Array | Buffer
  ): Promise<LocalModuleContext> {
    const zip = await JSZip.loadAsync(zipBuffer as any)
    const allFiles = Object.keys((zip as any).files || {})
      .filter((filePath) => !(zip as any).files[filePath].dir)
      .filter((filePath) => !filePath.startsWith('__MACOSX/'))

    const topLevels = new Set(
      allFiles
        .map((filePath) => filePath.split('/')[0])
        .filter((segment) => !!segment && segment !== '.' && segment !== '..')
    )
    const rootPrefix = topLevels.size === 1 ? `${[...topLevels][0]}/` : ''
    const joinRoot = (subPath: string) =>
      rootPrefix ? rootPrefix + subPath.replace(/^\/+/, '') : subPath.replace(/^\/+/, '')
    const readText = async (relPath: string) => {
      const file = zip.file(relPath)
      return file ? await file.async('string') : null
    }
    const appFiles = allFiles.map((filePath) =>
      this.normalizeVirtualPath(
        rootPrefix && filePath.startsWith(rootPrefix) ? filePath.slice(rootPrefix.length) : filePath
      )
    )

    return {
      allFiles: appFiles,
      fileSet: new Set(appFiles),
      readText: async (filePath: string) => readText(joinRoot(filePath)),
      readDataUrl: async (filePath: string) => {
        const normalizedPath = this.normalizeVirtualPath(filePath)
        const zipFile = zip.file(joinRoot(normalizedPath))
        if (!zipFile) return null

        const mimeType = this.getMimeTypeByAssetPath(normalizedPath)
        const base64Content = await zipFile.async('base64')
        return `data:${mimeType};base64,${base64Content}`
      }
    }
  }

  private async unzipZipBufferToAppDirectory(zipBuffer: ArrayBuffer | Uint8Array | Buffer): Promise<string> {
    const tmpBase = await fs.mkdtemp(path.join(os.tmpdir(), 'vue-to-dsl-'))
    const zip = await JSZip.loadAsync(zipBuffer as any)
    const fileEntries: string[] = []
    const writeTasks: Promise<any>[] = []

    zip.forEach((relPath, file) => {
      if (relPath.startsWith('__MACOSX/')) return
      const outPath = path.join(tmpBase, relPath)
      if (file.dir) {
        writeTasks.push(fs.mkdir(outPath, { recursive: true }))
        return
      }

      fileEntries.push(relPath)
      writeTasks.push(
        (async () => {
          await fs.mkdir(path.dirname(outPath), { recursive: true })
          const content = await file.async('nodebuffer')
          await fs.writeFile(outPath, content)
        })()
      )
    })

    await Promise.all(writeTasks)

    const topLevels = new Set(
      fileEntries
        .map((filePath) => filePath.split('/')[0])
        .filter((segment) => !!segment && segment !== '.' && segment !== '..')
    )

    if (topLevels.size === 1) {
      return path.join(tmpBase, [...topLevels][0])
    }

    return tmpBase
  }

  private async createModuleContextFromFileList(files: FileList): Promise<LocalModuleContext> {
    const fileArray = Array.from(files)
    const readText = async (file: File) =>
      await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(reader.error)
        reader.readAsText(file)
      })

    let relevantFiles = fileArray
    const gitignoreFile = fileArray.find((file) => file.webkitRelativePath.endsWith('/.gitignore'))

    if (gitignoreFile) {
      const gitignoreContent = await readText(gitignoreFile)
      const rootDir = gitignoreFile.webkitRelativePath.split('/')[0]
      const filter = this.createGitignoreFilter(gitignoreContent)

      relevantFiles = fileArray.filter((file) => {
        const relativePath = file.webkitRelativePath.slice(rootDir.length + 1)
        return relativePath && filter(relativePath)
      })
    } else {
      relevantFiles = fileArray.filter((file) => !file.webkitRelativePath.includes('node_modules'))
    }

    const getAppRelativePath = (file: File) =>
      this.normalizeVirtualPath(file.webkitRelativePath.split('/').slice(1).join('/'))
    const filesByPath = new Map<string, File>(relevantFiles.map((file) => [getAppRelativePath(file), file]))

    return {
      allFiles: Array.from(filesByPath.keys()),
      fileSet: new Set(filesByPath.keys()),
      readText: async (filePath: string) => {
        const file = filesByPath.get(this.normalizeVirtualPath(filePath))
        return file ? await readText(file) : null
      },
      readDataUrl: async (filePath: string) => {
        const file = filesByPath.get(this.normalizeVirtualPath(filePath))
        if (!file) return null

        return await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = () => reject(reader.error)
          reader.readAsDataURL(file)
        }).catch(() => null)
      }
    }
  }

  // Convert a full app directory (e.g., test/full/input/appdemo01) into an aggregated schema.json
  async convertAppDirectory(appDir: string): Promise<any> {
    const moduleContext = await this.createModuleContextFromAppDirectory(appDir)
    return await this.buildAppSchemaFromModuleContext(moduleContext)
  }

  setOptions(options: VueToSchemaOptions) {
    this.rawOptions = { ...this.rawOptions, ...options }
    this.options = this.normalizeOptions(this.rawOptions)
  }

  getOptions(): VueToSchemaOptions {
    return { ...this.options }
  }

  // Convert an app from a zip buffer (in-memory). The buffer should be the content of the zip file (not a path).
  async convertAppFromZip(zipBuffer: ArrayBuffer | Uint8Array | Buffer): Promise<any> {
    // Browser-safe path: avoid fs/path/os, work fully in-memory
    if (typeof window !== 'undefined' && typeof (window as any).document !== 'undefined') {
      const moduleContext = await this.createModuleContextFromBrowserZip(zipBuffer)
      return await this.buildAppSchemaFromModuleContext(moduleContext)
    }

    const appRoot = await this.unzipZipBufferToAppDirectory(zipBuffer)
    return await this.convertAppDirectory(appRoot)
  }

  async convertAppFromDirectory(files: FileList): Promise<any> {
    const moduleContext = await this.createModuleContextFromFileList(files)
    return await this.buildAppSchemaFromModuleContext(moduleContext)
  }
}
