import { parseSFC } from './parser/index'
import { parseTemplate } from './parsers/templateParser'
import { parseScript } from './parsers/scriptParser'
import { parseStyle } from './parsers/styleParser'
import { generateSchema, generateAppSchema } from './generator/index'
import { defaultComponentMap } from './constants'
import { parse as babelParse } from '@babel/parser'
import traverseModule from '@babel/traverse'
import * as t from '@babel/types'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import JSZip from 'jszip'

const traverse: any = (traverseModule as any)?.default ?? (traverseModule as any)

export interface VueToSchemaOptions {
  componentMap?: Record<string, string>
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
}

type LocalModuleContext = {
  allFiles: string[]
  fileSet: Set<string>
  readText: (filePath: string) => Promise<string | null>
}

export class VueToDslConverter {
  private options: VueToSchemaOptions

  constructor(options: VueToSchemaOptions = {}) {
    this.options = {
      componentMap: defaultComponentMap,
      preserveComments: false,
      strictMode: false,
      computed_flag: false,
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
                computed: scriptSchema.computed || {}
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

      const schema = await generateSchema(templateSchema, scriptSchema, styleSchema, this.options as any)

      return {
        schema,
        dependencies: [...new Set(dependencies)],
        errors,
        warnings,
        scriptSchema
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
            value: '',
            package: found.source,
            destructuring: found.destructuring,
            exportName: found.imported === 'default' || found.imported === '*' ? found.local : found.imported
          }
        })
      } else {
        utils.push({ name: exportedName, type: 'function', content: { type: 'JSFunction', value: '' } })
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
        value: ''
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
        value: '',
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
            const importedName = t.isIdentifier(specifier.local) ? specifier.local.name : specifier.local.value
            const exportedName = t.isIdentifier(specifier.exported) ? specifier.exported.name : specifier.exported.value
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
          const localName = t.isIdentifier(specifier.local) ? specifier.local.name : specifier.local.value
          const exportedName = t.isIdentifier(specifier.exported) ? specifier.exported.name : specifier.exported.value

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
  // Convert a full app directory (e.g., test/full/input/appdemo01) into an aggregated schema.json
  async convertAppDirectory(appDir: string): Promise<any> {
    const srcDir = path.join(appDir, 'src')
    const viewsDir = path.join(srcDir, 'views')
    const appFiles = (await this.walk(appDir, (_p) => true)).map((filePath) =>
      this.normalizeVirtualPath(path.relative(appDir, filePath))
    )
    const moduleContext: LocalModuleContext = {
      allFiles: appFiles,
      fileSet: new Set(appFiles),
      readText: async (filePath: string) => {
        try {
          return await fs.readFile(path.join(appDir, ...this.normalizeVirtualPath(filePath).split('/')), 'utf-8')
        } catch {
          return null
        }
      }
    }

    // 1) Collect page schemas from all .vue files under src/views/**
    const vueFiles = await this.walk(viewsDir, (p) => p.endsWith('.vue'))

    // First pass: collect all files and detect naming conflicts
    const fileMap = new Map<string, string[]>()
    for (const filePath of vueFiles) {
      const relativePath = path.relative(viewsDir, filePath)
      const baseName = path.basename(relativePath, '.vue')
      if (!fileMap.has(baseName)) {
        fileMap.set(baseName, [])
      }
      fileMap.get(baseName)!.push(relativePath)
    }

    // Determine which files need special naming (camelCase with directory prefix)
    const needsSpecialNaming = new Set<string>()
    for (const paths of fileMap.values()) {
      if (paths.length > 1) {
        // Multiple files with same basename, all need special naming
        paths.forEach((p) => needsSpecialNaming.add(p))
      }
    }

    // Helper function to convert path to camelCase
    const pathToCamelCase = (relativePath: string, baseName: string): string => {
      const parts = relativePath.replace(/\.vue$/i, '').split(/[\\/]/)
      if (parts.length === 1) {
        return baseName
      }
      // Join directory parts with the filename in camelCase
      const dirParts = parts.slice(0, -1)
      const camelCaseDir = dirParts
        .map((part, index) => (index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
        .join('')
      return camelCaseDir + baseName.charAt(0).toUpperCase() + baseName.slice(1)
    }

    // Convert files with appropriate naming
    const pageResults: ConvertResult[] = []
    for (const filePath of vueFiles) {
      try {
        const vueCode = await fs.readFile(filePath, 'utf-8')
        const relativePath = path.relative(viewsDir, filePath)
        const baseName = path.basename(relativePath, '.vue')

        // Use camelCase naming if there are conflicts, otherwise use basename
        let fileName: string
        if (needsSpecialNaming.has(relativePath)) {
          fileName = pathToCamelCase(relativePath, baseName)
        } else {
          fileName = baseName
        }

        const result = await this.convertFromString(vueCode, fileName)
        if (result.scriptSchema) {
          result.scriptSchema.__filePath = this.normalizeVirtualPath(path.relative(appDir, filePath))
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

    // 3) Load utils from src/utils or src/utils/index
    let utils: any[] = await this.collectRootUtils(moduleContext)

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
        let info = byFile[fileName]
        // If not found, try to match by checking if fileName ends with the base name (for camelCase names)
        if (!info) {
          for (const [base, routeInfo] of Object.entries(byFile)) {
            if (fileName.endsWith(base.charAt(0).toUpperCase() + base.slice(1))) {
              info = routeInfo
              break
            }
          }
        }
        ps.meta = ps.meta || {}
        if (info) {
          // Remove leading slash from router path
          const routerPath = info.routePath.startsWith('/') ? info.routePath.slice(1) : info.routePath
          ps.meta.router = routerPath
          ps.meta.isPage = true
          ps.meta.isHome = !!info.isHome
        } else {
          // Generate default router path from fileName if no match found
          ps.meta.router = fileName.toLowerCase()
          ps.meta.isPage = true
        }
      }
    } catch (error) {
      // If router enrichment fails, set default router for all pages
      for (const ps of pageSchemas) {
        ps.meta = ps.meta || {}
        if (!ps.meta.router) {
          ps.meta.router = (ps.fileName || 'page').toLowerCase()
          ps.meta.isPage = true
        }
      }
    }

    // 7) Collect sub-components from src/components/**/*.vue and convert to block schemas
    const blockSchemas: any[] = []
    try {
      const componentsDir = path.join(srcDir, 'components')
      const componentVueFiles = await this.walk(componentsDir, (p) => p.endsWith('.vue'))
      for (const filePath of componentVueFiles) {
        try {
          const vueCode = await fs.readFile(filePath, 'utf-8')
          const baseName = path.basename(filePath, '.vue')
          const savedOptions = { ...this.options }
          this.options = { ...this.options, isBlock: true } as any
          const result = await this.convertFromString(vueCode, baseName)
          this.options = savedOptions
          if (result.scriptSchema) {
            result.scriptSchema.__filePath = this.normalizeVirtualPath(path.relative(appDir, filePath))
          }
          if (result.schema) {
            result.schema.componentName = 'Block'
            blockSchemas.push(result.schema)
          }
          pageResults.push(result)
        } catch {
          // skip individual component conversion errors
        }
      }
    } catch {
      // ignore if src/components doesn't exist
    }

    // Also scan page schemas for componentType=Block nodes and ensure they have block schemas
    this.collectBlockRefsFromSchemas(pageSchemas, blockSchemas)
    utils = await this.enrichUtilsFromScriptResults(pageResults, utils, moduleContext)

    // 8) Assemble app schema
    const appSchema = generateAppSchema(pageSchemas, {
      i18n,
      utils,
      dataSource,
      globalState,
      blockSchemas
    })

    return appSchema
  }

  // Recursively collect componentType=Block references from page schemas
  // to ensure all referenced blocks have corresponding block schemas
  private collectBlockRefsFromSchemas(pageSchemas: any[], blockSchemas: any[]): void {
    const existingBlockNames = new Set(blockSchemas.map((b) => b.fileName))

    const collectBlockNames = (node: any): void => {
      if (!node || typeof node !== 'object') return
      if (node.componentType === 'Block' && node.componentName && !existingBlockNames.has(node.componentName)) {
        // Create a placeholder block schema for referenced but not found components
        existingBlockNames.add(node.componentName)
        blockSchemas.push({
          componentName: 'Block',
          fileName: node.componentName,
          meta: { name: node.componentName },
          children: node.children || [],
          props: node.props || {},
          state: {},
          methods: {}
        })
      }
      if (Array.isArray(node.children)) {
        node.children.forEach(collectBlockNames)
      }
    }

    for (const ps of pageSchemas) {
      if (ps?.children) {
        ps.children.forEach(collectBlockNames)
      }
    }
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
      const appFiles = allFiles.map((filePath) =>
        this.normalizeVirtualPath(
          rootPrefix && filePath.startsWith(rootPrefix) ? filePath.slice(rootPrefix.length) : filePath
        )
      )
      const moduleContext: LocalModuleContext = {
        allFiles: appFiles,
        fileSet: new Set(appFiles),
        readText: async (filePath: string) => readText(joinRoot(filePath))
      }

      // 1) Pages: src/views/**/*.vue
      const viewPrefix = joinRoot('src/views/')
      const vueFiles = allFiles.filter((p) => p.startsWith(viewPrefix) && p.endsWith('.vue'))

      // First pass: collect all files and detect naming conflicts
      const fileMap = new Map<string, string[]>()
      for (const vf of vueFiles) {
        const relativePath = vf.substring(viewPrefix.length)
        const baseName =
          relativePath
            .split('/')
            .pop()
            ?.replace(/\.vue$/i, '') || ''
        if (!fileMap.has(baseName)) {
          fileMap.set(baseName, [])
        }
        fileMap.get(baseName)!.push(relativePath)
      }

      // Determine which files need special naming (camelCase with directory prefix)
      const needsSpecialNaming = new Set<string>()
      for (const paths of fileMap.values()) {
        if (paths.length > 1) {
          // Multiple files with same basename, all need special naming
          paths.forEach((p) => needsSpecialNaming.add(p))
        }
      }

      // Helper function to convert path to camelCase
      const pathToCamelCase = (relativePath: string, baseName: string): string => {
        const parts = relativePath.replace(/\.vue$/i, '').split('/')
        if (parts.length === 1) {
          return baseName
        }
        // Join directory parts with the filename in camelCase
        const dirParts = parts.slice(0, -1)
        const camelCaseDir = dirParts
          .map((part, index) => (index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
          .join('')
        return camelCaseDir + baseName.charAt(0).toUpperCase() + baseName.slice(1)
      }

      // Convert files with appropriate naming
      const pageResults: ConvertResult[] = []
      const pageSchemas: any[] = []
      for (const vf of vueFiles) {
        const code = await readText(vf)
        if (!code) continue

        const relativePath = vf.substring(viewPrefix.length)
        const baseName =
          relativePath
            .split('/')
            .pop()
            ?.replace(/\.vue$/i, '') || 'Page'

        // Use camelCase naming if there are conflicts, otherwise use basename
        let fileName: string
        if (needsSpecialNaming.has(relativePath)) {
          fileName = pathToCamelCase(relativePath, baseName)
        } else {
          fileName = baseName
        }

        const res = await this.convertFromString(code, fileName)
        if (res.scriptSchema) {
          res.scriptSchema.__filePath = this.normalizeVirtualPath(
            rootPrefix && vf.startsWith(rootPrefix) ? vf.slice(rootPrefix.length) : vf
          )
        }
        pageResults.push(res)
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

      // 3) utils from src/utils or src/utils/index
      let utils: any[] = await this.collectRootUtils(moduleContext)

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
            let info = byFile[fileName]
            // If not found, try to match by checking if fileName ends with the base name (for camelCase names)
            if (!info) {
              for (const [base, routeInfo] of Object.entries(byFile)) {
                // Try exact match (case-insensitive)
                if (fileName.toLowerCase() === base.toLowerCase()) {
                  info = routeInfo
                  break
                }
                // Try matching if fileName ends with base name (for camelCase names)
                if (fileName.endsWith(base.charAt(0).toUpperCase() + base.slice(1))) {
                  info = routeInfo
                  break
                }
              }
            }
            ps.meta = ps.meta || {}
            if (info) {
              // Remove leading slash from router path
              const routerPath = info.routePath.startsWith('/') ? info.routePath.slice(1) : info.routePath
              ps.meta.router = routerPath
              ps.meta.isPage = true
              ps.meta.isHome = !!info.isHome
            } else {
              // Generate default router path from fileName if no match found
              ps.meta.router = fileName.toLowerCase()
              ps.meta.isPage = true
            }
          }
        } else {
          // If router file not found, set default router for all pages
          for (const ps of pageSchemas) {
            ps.meta = ps.meta || {}
            if (!ps.meta.router) {
              ps.meta.router = (ps.fileName || 'page').toLowerCase()
              ps.meta.isPage = true
            }
          }
        }
      } catch (error) {
        // If router enrichment fails, set default router for all pages
        for (const ps of pageSchemas) {
          ps.meta = ps.meta || {}
          if (!ps.meta.router) {
            ps.meta.router = (ps.fileName || 'page').toLowerCase()
            ps.meta.isPage = true
          }
        }
      }

      // 7) Collect sub-components from src/components/**/*.vue and convert to block schemas
      const blockSchemas: any[] = []
      const componentsPrefix = joinRoot('src/components/')
      const componentVueFiles = allFiles.filter((p) => p.startsWith(componentsPrefix) && p.endsWith('.vue'))
      for (const cf of componentVueFiles) {
        try {
          const code = await readText(cf)
          if (!code) continue
          const baseName = (cf.split('/').pop() || '').replace(/\.vue$/i, '') || 'Block'
          const savedOptions = { ...this.options }
          this.options = { ...this.options, isBlock: true } as any
          const res = await this.convertFromString(code, baseName)
          this.options = savedOptions
          if (res.scriptSchema) {
            res.scriptSchema.__filePath = this.normalizeVirtualPath(
              rootPrefix && cf.startsWith(rootPrefix) ? cf.slice(rootPrefix.length) : cf
            )
          }
          if (res.schema) {
            res.schema.componentName = 'Block'
            blockSchemas.push(res.schema)
          }
          pageResults.push(res)
        } catch {
          // skip individual component conversion errors
        }
      }

      // Also scan page schemas for componentType=Block nodes
      this.collectBlockRefsFromSchemas(pageSchemas, blockSchemas)
      utils = await this.enrichUtilsFromScriptResults(pageResults, utils, moduleContext)

      // 8) Assemble app schema
      const appSchema = generateAppSchema(pageSchemas, {
        i18n,
        utils,
        dataSource,
        globalState,
        blockSchemas
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

  async convertAppFromDirectory(files: FileList): Promise<any> {
    const fileArray = Array.from(files)
    let relevantFiles = []

    const readText = async (file: File) => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(reader.error)
        reader.readAsText(file)
      })
    }

    const createGitignoreFilter = (gitignoreContent: string) => {
      const lines = gitignoreContent
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith('#'))
      const patterns = lines.map((line) => {
        const isNegative = line.startsWith('!')
        const pattern = isNegative ? line.slice(1) : line

        // Convert gitignore pattern to regex
        const regexString = pattern
          .replace(/([.+?^${}()|[\]\\])/g, '\\$1') // Escape special chars
          .replace(/\/\*\*$/, '/.*') // '/**' at the end
          .replace(/\*\*/g, '.*') // '**'
          .replace(/\*/g, '[^/]*') // '*'
          .replace(/\?/g, '[^/]') // '?'

        // Handle directory matching
        if (regexString.endsWith('/')) {
          return { regex: new RegExp(`^${regexString}`), isNegative }
        }

        return { regex: new RegExp(`^${regexString}(/.*)?$`), isNegative }
      })

      return (path: string) => {
        let isIgnored = false
        for (const { regex, isNegative } of patterns) {
          if (regex.test(path)) {
            isIgnored = !isNegative
          }
        }
        return !isIgnored
      }
    }

    const gitignoreFile = fileArray.find((file) => file.webkitRelativePath.endsWith('/.gitignore'))

    if (gitignoreFile) {
      const gitignoreContent = await readText(gitignoreFile)
      const rootDir = gitignoreFile.webkitRelativePath.split('/')[0]
      const filter = createGitignoreFilter(gitignoreContent)

      relevantFiles = fileArray.filter((file) => {
        const relativePath = file.webkitRelativePath.slice(rootDir.length + 1)
        return relativePath && filter(relativePath)
      })
    } else {
      // Filter out node_modules
      relevantFiles = fileArray.filter((file) => !file.webkitRelativePath.includes('node_modules'))
    }

    const getAppRelativePath = (file: File) =>
      this.normalizeVirtualPath(file.webkitRelativePath.split('/').slice(1).join('/'))
    const filesByPath = new Map<string, File>(relevantFiles.map((file) => [getAppRelativePath(file), file]))
    const moduleContext: LocalModuleContext = {
      allFiles: Array.from(filesByPath.keys()),
      fileSet: new Set(filesByPath.keys()),
      readText: async (filePath: string) => {
        const file = filesByPath.get(this.normalizeVirtualPath(filePath))
        return file ? await readText(file) : null
      }
    }

    // 1) Pages: src/views/**/*.vue
    const vueFiles = relevantFiles.filter(
      (file) => file.webkitRelativePath.includes('src/views/') && file.name.endsWith('.vue')
    )

    // First pass: collect all files and detect naming conflicts
    const fileMap = new Map<string, string[]>()
    for (const vf of vueFiles) {
      const webkitPath = vf.webkitRelativePath
      const viewsIndex = webkitPath.indexOf('src/views/')
      const relativePath = viewsIndex >= 0 ? webkitPath.substring(viewsIndex + 'src/views/'.length) : vf.name
      const baseName =
        relativePath
          .split('/')
          .pop()
          ?.replace(/\.vue$/i, '') || ''
      if (!fileMap.has(baseName)) {
        fileMap.set(baseName, [])
      }
      fileMap.get(baseName)!.push(relativePath)
    }

    // Determine which files need special naming (camelCase with directory prefix)
    const needsSpecialNaming = new Set<string>()
    for (const paths of fileMap.values()) {
      if (paths.length > 1) {
        // Multiple files with same basename, all need special naming
        paths.forEach((p) => needsSpecialNaming.add(p))
      }
    }

    // Helper function to convert path to camelCase
    const pathToCamelCase = (relativePath: string, baseName: string): string => {
      const parts = relativePath.replace(/\.vue$/i, '').split('/')
      if (parts.length === 1) {
        return baseName
      }
      // Join directory parts with the filename in camelCase
      const dirParts = parts.slice(0, -1)
      const camelCaseDir = dirParts
        .map((part, index) => (index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
        .join('')
      return camelCaseDir + baseName.charAt(0).toUpperCase() + baseName.slice(1)
    }

    const pageResults: ConvertResult[] = []
    const pageSchemas: any[] = []
    for (const vf of vueFiles) {
      const code = await readText(vf)
      if (!code) continue

      const webkitPath = vf.webkitRelativePath
      const viewsIndex = webkitPath.indexOf('src/views/')
      const relativePath = viewsIndex >= 0 ? webkitPath.substring(viewsIndex + 'src/views/'.length) : vf.name
      const baseName =
        relativePath
          .split('/')
          .pop()
          ?.replace(/\.vue$/i, '') || 'Page'

      // Use camelCase naming if there are conflicts, otherwise use basename
      let fileName: string
      if (needsSpecialNaming.has(relativePath)) {
        fileName = pathToCamelCase(relativePath, baseName)
      } else {
        fileName = baseName
      }

      const res = await this.convertFromString(code, fileName)
      if (res.scriptSchema) {
        res.scriptSchema.__filePath = getAppRelativePath(vf)
      }
      pageResults.push(res)
      if (res.schema) pageSchemas.push(res.schema)
    }

    // 2) i18n
    let i18n: any = { en_US: {}, zh_CN: {} }
    try {
      const enFile = relevantFiles.find((f) => f.webkitRelativePath.endsWith('src/i18n/en_US.json'))
      const zhFile = relevantFiles.find((f) => f.webkitRelativePath.endsWith('src/i18n/zh_CN.json'))
      const en = enFile ? await readText(enFile) : '{}'
      const zh = zhFile ? await readText(zhFile) : '{}'
      i18n = { en_US: JSON.parse(en), zh_CN: JSON.parse(zh) }
    } catch {
      // keep defaults
    }

    // 3) utils from src/utils or src/utils/index
    let utils: any[] = await this.collectRootUtils(moduleContext)

    // 4) dataSource
    const dataSource: any = { list: [] }
    try {
      const dsFile = relevantFiles.find((f) => f.webkitRelativePath.endsWith('src/lowcodeConfig/dataSource.json'))
      if (dsFile) {
        const dsRaw = await readText(dsFile)
        const dsJson = JSON.parse(dsRaw)
        if (Array.isArray(dsJson.list)) dataSource.list = dsJson.list
      }
    } catch {
      // ignore
    }

    // 5) globalState from src/stores/*.js
    const storeFiles = relevantFiles.filter(
      (f) => f.webkitRelativePath.includes('src/stores/') && f.name.endsWith('.js')
    )
    const globalState: any[] = []
    for (const sf of storeFiles) {
      try {
        const code = await readText(sf)
        if (!code || !/defineStore\s*\(/.test(code)) continue
        const idMatch = code.match(/id:\s*['"]([^'"]+)['"]/)
        const stateMatch = code.match(/state:\s*\(\)\s*=>\s*\((\{[\s\S]*?\})\)/)
        const entry: any = { id: idMatch ? idMatch[1] : sf.name.replace(/\.[^.]+$/, '') }
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
      const routerFile = relevantFiles.find((f) => f.webkitRelativePath.endsWith('src/router/index.js'))
      if (routerFile) {
        const rcode = await readText(routerFile)
        const homeMatch = rcode.match(/redirect:\s*\{\s*name:\s*['"]([^'"]+)['"]/)
        const homeName = homeMatch ? homeMatch[1] : ''
        const rclean = rcode.replace(/redirect\s*:\s*\{[\s\S]*?\}/, '')
        const routeEntries: Array<{ routeName: string; routePath: string; importPath: string }> = []
        const routeRegex =
          /name:\s*['"]([^'"]+)['"][\s\S]*?path:\s*['"]([^'"]+)['"][\s\S]*?component:\s*\(\)\s*=>\s*import\(\s*['"]([^'"]+)['"]\s*\)/g
        let m: RegExpExecArray | null
        while ((m = routeRegex.exec(rclean))) routeEntries.push({ routeName: m[1], routePath: m[2], importPath: m[3] })
        const byFile: Record<string, { routeName: string; routePath: string; isHome: boolean }> = {}
        for (const e of routeEntries) {
          const base = (e.importPath.split('/').pop() || '').replace(/\.vue$/i, '')
          byFile[base] = { routeName: e.routeName, routePath: e.routePath, isHome: e.routeName === homeName }
        }
        for (const ps of pageSchemas) {
          const fileName = ps?.fileName
          if (!fileName) continue
          let info = byFile[fileName]
          // If not found, try to match by checking if fileName ends with the base name (for camelCase names)
          if (!info) {
            for (const [base, routeInfo] of Object.entries(byFile)) {
              // Try exact match (case-insensitive)
              if (fileName.toLowerCase() === base.toLowerCase()) {
                info = routeInfo
                break
              }
              // Try matching if fileName ends with base name (for camelCase names)
              if (fileName.endsWith(base.charAt(0).toUpperCase() + base.slice(1))) {
                info = routeInfo
                break
              }
            }
          }
          ps.meta = ps.meta || {}
          if (info) {
            // Remove leading slash from router path
            const routerPath = info.routePath.startsWith('/') ? info.routePath.slice(1) : info.routePath
            ps.meta.router = routerPath
            ps.meta.isPage = true
            ps.meta.isHome = !!info.isHome
          } else {
            // Generate default router path from fileName if no match found
            ps.meta.router = fileName.toLowerCase()
            ps.meta.isPage = true
          }
        }
      } else {
        // If router file not found, set default router for all pages
        for (const ps of pageSchemas) {
          ps.meta = ps.meta || {}
          if (!ps.meta.router) {
            ps.meta.router = (ps.fileName || 'page').toLowerCase()
            ps.meta.isPage = true
          }
        }
      }
    } catch (error) {
      // If router enrichment fails, set default router for all pages
      for (const ps of pageSchemas) {
        ps.meta = ps.meta || {}
        if (!ps.meta.router) {
          ps.meta.router = (ps.fileName || 'page').toLowerCase()
          ps.meta.isPage = true
        }
      }
    }

    // 7) Collect sub-components from src/components/**/*.vue and convert to block schemas
    const blockSchemas: any[] = []
    const componentVueFiles = relevantFiles.filter(
      (file) => file.webkitRelativePath.includes('src/components/') && file.name.endsWith('.vue')
    )
    for (const cf of componentVueFiles) {
      try {
        const code = await readText(cf)
        if (!code) continue
        const baseName = cf.name.replace(/\.vue$/i, '') || 'Block'
        const savedOptions = { ...this.options }
        this.options = { ...this.options, isBlock: true } as any
        const res = await this.convertFromString(code, baseName)
        this.options = savedOptions
        if (res.scriptSchema) {
          res.scriptSchema.__filePath = getAppRelativePath(cf)
        }
        if (res.schema) {
          res.schema.componentName = 'Block'
          blockSchemas.push(res.schema)
        }
        pageResults.push(res)
      } catch {
        // skip individual component conversion errors
      }
    }

    // Also scan page schemas for componentType=Block nodes
    this.collectBlockRefsFromSchemas(pageSchemas, blockSchemas)
    utils = await this.enrichUtilsFromScriptResults(pageResults, utils, moduleContext)

    // 8) Assemble app schema
    const appSchema = generateAppSchema(pageSchemas, {
      i18n,
      utils,
      dataSource,
      globalState,
      blockSchemas
    })

    return appSchema
  }
}
