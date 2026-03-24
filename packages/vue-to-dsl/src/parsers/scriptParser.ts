import { parse } from '@babel/parser'
import traverseModule from '@babel/traverse'
import * as t from '@babel/types'

const traverse: any = (traverseModule as any)?.default ?? (traverseModule as any)

const JS_GLOBALS = new Set([
  'Math',
  'Number',
  'String',
  'Boolean',
  'Array',
  'Object',
  'Date',
  'JSON',
  'console',
  'Intl',
  'RegExp',
  'Map',
  'Set',
  'WeakMap',
  'WeakSet',
  'Promise',
  'Symbol',
  'BigInt',
  'parseInt',
  'parseFloat',
  'isNaN',
  'isFinite',
  'encodeURI',
  'decodeURI',
  'encodeURIComponent',
  'decodeURIComponent',
  'undefined',
  'NaN',
  'Infinity',
  'window',
  'document',
  'localStorage',
  'sessionStorage',
  'navigator',
  'location',
  'history',
  'fetch',
  'URL',
  'URLSearchParams',
  'setTimeout',
  'clearTimeout',
  'setInterval',
  'clearInterval',
  'alert'
])

const LIFECYCLE_HOOKS = [
  'onMounted',
  'onUpdated',
  'onUnmounted',
  'onBeforeMount',
  'onBeforeUpdate',
  'onBeforeUnmount',
  'onActivated',
  'onDeactivated',
  'mounted',
  'updated',
  'unmounted',
  'beforeMount',
  'beforeUpdate',
  'beforeUnmount',
  'activated',
  'deactivated',
  'created',
  'beforeCreate',
  'destroyed',
  'beforeDestroy',
  'setup'
]

function isVueReactiveCall(node: any, apiName: string) {
  if (!t.isCallExpression(node)) return false
  // direct call: reactive()/ref()/computed()
  if (t.isIdentifier(node.callee) && node.callee.name === apiName) return true
  // member call: vue.reactive()/Vue.ref()/anything.ref()
  if (t.isMemberExpression(node.callee)) {
    const callee = node.callee
    const prop = callee.property
    if (t.isIdentifier(prop) && prop.name === apiName) return true
  }
  return false
}

function isLifecycleHook(name: string) {
  return LIFECYCLE_HOOKS.includes(name)
}

function getNodeValue(node: any): any {
  if (t.isStringLiteral(node)) return node.value
  if (t.isNumericLiteral(node)) return node.value
  if (t.isBooleanLiteral(node)) return node.value
  if (t.isNullLiteral(node)) return null
  if (t.isUnaryExpression(node) && node.operator === '-' && t.isNumericLiteral(node.argument)) {
    return -node.argument.value
  }
  if (t.isCallExpression(node)) {
    let calleeStr = ''
    if (t.isIdentifier(node.callee)) {
      calleeStr = node.callee.name
    } else if (t.isMemberExpression(node.callee)) {
      const obj = node.callee.object as any
      const prop = node.callee.property as any
      const objStr = t.isIdentifier(obj) ? obj.name : ''
      const propStr = t.isIdentifier(prop) ? prop.name : ''
      if (objStr && propStr) calleeStr = `${objStr}.${propStr}`
    }
    const args = node.arguments.map((arg: any) => getNodeValue(arg))
    if (calleeStr)
      return `${calleeStr}(${args.map((a: any) => (typeof a === 'string' ? `'${a}'` : String(a))).join(', ')})`
    return 'undefined'
  }
  if (t.isObjectExpression(node)) {
    const obj: Record<string, any> = {}
    node.properties.forEach((prop: any) => {
      if (t.isObjectProperty(prop)) {
        let keyName: string | null = null
        if (t.isIdentifier(prop.key)) keyName = prop.key.name
        else if (t.isStringLiteral(prop.key)) keyName = prop.key.value
        else if (t.isNumericLiteral(prop.key)) keyName = String(prop.key.value)
        if (keyName) obj[keyName] = getNodeValue(prop.value as any)
      }
    })
    return obj
  }
  if (t.isArrayExpression(node)) {
    return node.elements.map((el: any) => (el ? getNodeValue(el) : null))
  }
  return 'undefined'
}

function getSource(node: any, source: string): string {
  if (!node) return ''
  const start = (node as any).start
  const end = (node as any).end
  if (typeof start === 'number' && typeof end === 'number') return source.slice(start, end)
  return ''
}

function applyReplacements(code: string, replacements: Array<{ start: number; end: number; text: string }>) {
  return replacements
    .sort((a, b) => b.start - a.start || b.end - a.end)
    .reduce((output, item) => `${output.slice(0, item.start)}${item.text}${output.slice(item.end)}`, code)
}

function isFrameworkImportSource(source: string) {
  return ['vue', 'vue-i18n'].includes(source)
}

function sanitizeCodeFromNode(node: any, source: string): string {
  const raw = getSource(node, source)
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

  return applyReplacements(raw, replacements)
}

function createScriptRewriteContext(result: any) {
  const stateEntries = result?.state || {}
  const propNames = new Set((result?.props || []).map((prop: any) => prop?.name).filter(Boolean))
  const stateNames = new Set(Object.keys(stateEntries))
  const refStateNames = new Set(
    Object.entries(stateEntries)
      .filter(([, value]: [string, any]) => value?.type === 'ref')
      .map(([name]) => name)
  )
  const methodNames = new Set(Object.keys(result?.methods || {}))
  const computedNames = new Set(Object.keys(result?.computed || {}))

  return {
    propNames,
    stateNames,
    refStateNames,
    methodNames,
    computedNames
  }
}

function resolveScriptIdentifierReplacement(name: string, context: any) {
  if (!name || name === 'this' || JS_GLOBALS.has(name)) return null

  if (name === 'state') return 'this.state'
  if (name === 'props') return 'this.props'
  if (name === 'emit') return 'this.emit'
  if (name === 'stores') return 'this.stores'
  if (name === 'bridge') return 'this.bridge'
  if (name === 'dataSourceMap') return 'this.dataSourceMap'

  if (context.propNames.has(name)) return `this.props.${name}`
  if (context.stateNames.has(name)) return `this.state.${name}`
  if (context.methodNames.has(name) || context.computedNames.has(name)) return `this.${name}`

  return null
}

function rewriteScriptContextInCode(code: string, result: any) {
  if (!code) return code

  const context = createScriptRewriteContext(result)
  if (
    context.propNames.size === 0 &&
    context.stateNames.size === 0 &&
    context.methodNames.size === 0 &&
    context.computedNames.size === 0
  ) {
    return code
  }

  try {
    const ast = parse(code, { sourceType: 'module', plugins: ['typescript', 'jsx'] as any })
    const replacements: Array<{ start: number; end: number; text: string }> = []
    const seenRanges = new Set<string>()

    const pushReplacement = (start: number, end: number, text: string) => {
      if (typeof start !== 'number' || typeof end !== 'number' || start >= end) return
      const key = `${start}:${end}:${text}`
      if (seenRanges.has(key)) return
      seenRanges.add(key)
      replacements.push({ start, end, text })
    }

    traverse(ast as any, {
      MemberExpression(path: any) {
        if (path.node.computed) return

        const objectNode = path.node.object
        const propertyNode = path.node.property
        if (!t.isIdentifier(objectNode) || !t.isIdentifier(propertyNode)) return

        const refLikeName = objectNode.name
        const isRefLikeState = context.refStateNames.has(refLikeName)
        const isComputedRef = context.computedNames.has(refLikeName)
        if (!isRefLikeState && !isComputedRef) return
        if (propertyNode.name !== 'value') return

        const binding = path.scope.getBinding(refLikeName)
        if (binding && binding.kind !== 'module') return

        const replacement = isComputedRef ? `this.${refLikeName}` : `this.state.${refLikeName}`
        pushReplacement(path.node.start, path.node.end, replacement)
      },
      Identifier(path: any) {
        if (!path.isReferencedIdentifier()) return

        const { node, parent } = path
        const name = node.name
        const binding = path.scope.getBinding(name)
        if (binding && binding.kind !== 'module') return

        if (
          path.parentPath.isMemberExpression({ property: node }) &&
          parent &&
          parent.property === node &&
          !parent.computed
        ) {
          return
        }

        if (path.parentPath.isObjectProperty({ key: node }) && parent && parent.key === node && !parent.computed) {
          return
        }

        if (
          path.parentPath.isMemberExpression() &&
          path.parent.object === path.node &&
          !path.parent.computed &&
          t.isIdentifier(path.parent.property) &&
          path.parent.property.name === 'value' &&
          (context.refStateNames.has(name) || context.computedNames.has(name))
        ) {
          return
        }

        const replacement = resolveScriptIdentifierReplacement(name, context)
        if (!replacement || replacement === name) return

        if (path.parentPath.isObjectProperty() && parent?.shorthand && parent.value === node) {
          pushReplacement(path.parent.start, path.parent.end, `${name}: ${replacement}`)
          return
        }

        pushReplacement(path.node.start, path.node.end, replacement)
      }
    })

    return applyReplacements(code, replacements)
  } catch {
    return code
  }
}

function rewriteScriptContextInEntries(entries: Record<string, any>, result: any) {
  Object.keys(entries || {}).forEach((key) => {
    const entry = entries[key]
    if (!entry) return
    if (typeof entry === 'string') {
      entries[key] = rewriteScriptContextInCode(entry, result)
      return
    }
    if (typeof entry.value === 'string') {
      entry.value = rewriteScriptContextInCode(entry.value, result)
    }
  })
  return entries
}

function rewriteScriptContextInResult(result: any) {
  result.methods = rewriteScriptContextInEntries(result.methods || {}, result)
  result.computed = rewriteScriptContextInEntries(result.computed || {}, result)
  result.lifeCycles = rewriteScriptContextInEntries(result.lifeCycles || {}, result)
}

function addUsedUtilImport(collector: any[], item: any) {
  if (!Array.isArray(collector) || !item?.source || !item?.local) return
  const exists = collector.some(
    (entry) => entry?.source === item.source && entry?.imported === item.imported && entry?.local === item.local
  )
  if (!exists) collector.push(item)
}

function getImportedUtilsMap(imports: any[] = []) {
  const importedUtils = new Map<string, any>()

  imports.forEach((imp: any) => {
    if (!imp?.source || isFrameworkImportSource(imp.source) || /\.vue$/i.test(imp.source)) return
    ;(imp.specifiers || []).forEach((spec: any) => {
      if (!spec?.local) return
      importedUtils.set(spec.local, { ...spec, source: imp.source })
    })
  })

  return importedUtils
}

function rewriteImportedUtilsInCode(code: string, imports: any[] = [], usedImports: any[] = []) {
  const importedUtils = getImportedUtilsMap(imports)

  if (!code || importedUtils.size === 0) return code

  try {
    const ast = parse(code, { sourceType: 'module', plugins: ['typescript', 'jsx'] as any })
    const replacements: Array<{ start: number; end: number; text: string }> = []
    const seenRanges = new Set<string>()

    const pushReplacement = (start: number, end: number, text: string) => {
      if (typeof start !== 'number' || typeof end !== 'number' || start >= end) return
      const key = `${start}:${end}:${text}`
      if (seenRanges.has(key)) return
      seenRanges.add(key)
      replacements.push({ start, end, text })
    }

    traverse(ast as any, {
      MemberExpression(path: any) {
        if (path.node.computed) return
        const objectNode = path.node.object
        const propertyNode = path.node.property
        if (!t.isIdentifier(objectNode) || !t.isIdentifier(propertyNode)) return

        const spec = importedUtils.get(objectNode.name)
        if (!spec || spec.kind !== 'namespace') return

        const binding = path.scope.getBinding(objectNode.name)
        if (binding && binding.kind !== 'module') return

        addUsedUtilImport(usedImports, {
          source: spec.source,
          imported: propertyNode.name,
          local: propertyNode.name,
          kind: 'named'
        })
        pushReplacement(path.node.start, path.node.end, `this.utils.${propertyNode.name}`)
      },
      Identifier(path: any) {
        const name = path.node?.name
        const spec = importedUtils.get(name)
        if (!name || !spec || !path.isReferencedIdentifier()) return

        const binding = path.scope.getBinding(name)
        if (binding && binding.kind !== 'module') return

        if (
          spec.kind === 'namespace' &&
          path.parentPath?.isMemberExpression() &&
          path.parent.object === path.node &&
          !path.parent.computed
        ) {
          return
        }

        addUsedUtilImport(usedImports, {
          source: spec.source,
          imported: spec.imported || 'default',
          local: spec.local,
          kind: spec.kind || 'named'
        })

        if (
          path.parentPath?.isObjectProperty() &&
          path.parent.shorthand &&
          path.parent.value === path.node &&
          path.parent.key === path.node
        ) {
          pushReplacement(path.parent.start, path.parent.end, `${name}: this.utils.${name}`)
          return
        }

        pushReplacement(path.node.start, path.node.end, `this.utils.${name}`)
      }
    })

    return applyReplacements(code, replacements)
  } catch {
    return code
  }
}

function rewriteImportedUtilsInEntries(entries: Record<string, any>, imports: any[] = [], usedImports: any[] = []) {
  Object.keys(entries || {}).forEach((key) => {
    const entry = entries[key]
    if (!entry) return
    if (typeof entry === 'string') {
      entries[key] = rewriteImportedUtilsInCode(entry, imports, usedImports)
      return
    }
    if (typeof entry.value === 'string') {
      entry.value = rewriteImportedUtilsInCode(entry.value, imports, usedImports)
    }
  })
  return entries
}

function rewriteImportedUtilsInResult(result: any) {
  const imports = result?.imports || []
  result.usedUtilsImports = []
  result.methods = rewriteImportedUtilsInEntries(result.methods || {}, imports, result.usedUtilsImports)
  result.computed = rewriteImportedUtilsInEntries(result.computed || {}, imports, result.usedUtilsImports)
  result.lifeCycles = rewriteImportedUtilsInEntries(result.lifeCycles || {}, imports, result.usedUtilsImports)
}

function arrowToFunctionString(name: string, node: t.ArrowFunctionExpression, source: string) {
  const asyncStr = node.async ? 'async ' : ''
  const params = node.params.map((p) => sanitizeCodeFromNode(p, source)).join(', ')
  if (t.isBlockStatement(node.body)) {
    const body = sanitizeCodeFromNode(node.body, source)
    return `${asyncStr}function ${name}(${params}) ${body}`
  }
  const expr = sanitizeCodeFromNode(node.body, source)
  return `${asyncStr}function ${name}(${params}) { return ${expr}; }`
}

function functionExpressionToNamedFunctionString(
  name: string,
  node: t.FunctionExpression | t.ObjectMethod,
  source: string
) {
  const asyncStr = (node as any).async ? 'async ' : ''
  const params = (node as any).params.map((p: any) => sanitizeCodeFromNode(p, source)).join(', ')
  const body = sanitizeCodeFromNode((node as any).body, source)
  return `${asyncStr}function ${name}(${params}) ${body}`
}

// ---- setup 专属逻辑的小分支封装（共享生命周期处理主干）----
const isSetupName = (name: string) => name === 'setup'

function setLifecycleEntry(result: any, name: string, code: string, opts: { noOverride?: boolean } = {}) {
  if (opts.noOverride && result.lifeCycles[name]) return
  result.lifeCycles[name] = { type: 'lifecycle', value: code || (name ? `function ${name}(){}` : 'function() {}') }
}

function setMethodEntry(result: any, name: string, code: string) {
  result.methods[name] = { type: 'function', value: code || `function ${name}(){}` }
}

function routeFunctionLikeByName(result: any, name: string, code: string) {
  if (isSetupName(name)) setLifecycleEntry(result, name, code)
  else setMethodEntry(result, name, code)
}

// Helpers to reduce duplication when handling variable declarators in <script setup>
function addMethodFromFunctionLike(name: string, init: any, result: any, source: string): boolean {
  // Direct function-like: foo = () => {} | function() {}
  if (t.isArrowFunctionExpression(init)) {
    const code = arrowToFunctionString(name, init, source)
    routeFunctionLikeByName(result, name, code)
    return true
  }
  if (t.isFunctionExpression(init)) {
    const code = functionExpressionToNamedFunctionString(name, init, source)
    routeFunctionLikeByName(result, name, code)
    return true
  }

  // Wrapped function-like by helper: foo = wrap(() => {}) | wrap(function() {})
  // Only treat known wrapper identifier 'wrap' as method binder to avoid misclassifying calls like computed(() => {}).
  if (t.isCallExpression(init) && t.isIdentifier(init.callee) && init.callee.name === 'wrap') {
    const fnArg = init.arguments.find(
      (arg: any) => t.isArrowFunctionExpression(arg) || t.isFunctionExpression(arg)
    ) as any
    if (fnArg) {
      if (t.isArrowFunctionExpression(fnArg)) {
        const code = arrowToFunctionString(name, fnArg, source)
        routeFunctionLikeByName(result, name, code)
        return true
      }
      if (t.isFunctionExpression(fnArg)) {
        const code = functionExpressionToNamedFunctionString(name, fnArg, source)
        routeFunctionLikeByName(result, name, code)
        return true
      }
    }
  }
  return false
}

function extractObjectValue(node: any): any {
  if (t.isObjectExpression(node)) {
    const obj: Record<string, any> = {}
    node.properties.forEach((prop: any) => {
      if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
        obj[prop.key.name] = extractObjectValue(prop.value)
      }
    })
    return obj
  }
  return getNodeValue(node)
}

function assignStateIfNamedState(name: string, init: any, result: any): boolean {
  if (name !== 'state') return false

  if (isVueReactiveCall(init, 'reactive')) {
    const firstArg = init.arguments && init.arguments[0]
    if (t.isObjectExpression(firstArg)) {
      const stateValue = extractObjectValue(firstArg)
      Object.entries(stateValue).forEach(([key, value]) => {
        result.state[key] = { type: 'reactive', value }
      })
    } else {
      const initCode = getNodeValue(init)
      result.state[name] = { type: 'reactive', value: initCode }
    }
    return true
  }

  if (isVueReactiveCall(init, 'ref')) {
    const firstArg = init.arguments && init.arguments[0]
    const value = firstArg ? getNodeValue(firstArg) : undefined
    result.state[name] = { type: 'ref', value }
    return true
  }

  // normal non-reactive assignment to state
  const initCode = getNodeValue(init)
  result.state[name] = { type: 'normal', value: initCode }
  return true
}

function assignComputedIfComputed(name: string, init: any, result: any, source: string): boolean {
  if (!isVueReactiveCall(init, 'computed')) return false

  const firstArg = (init.arguments && init.arguments[0]) as any
  let compCode = firstArg ? sanitizeCodeFromNode(firstArg, source) : getNodeValue(init)

  if (firstArg) {
    if (t.isArrowFunctionExpression(firstArg)) {
      compCode = arrowToFunctionString(name, firstArg, source)
    } else if (t.isFunctionExpression(firstArg)) {
      compCode = functionExpressionToNamedFunctionString(name, firstArg, source)
    } else if (t.isObjectExpression(firstArg)) {
      // Handle computed({ get: () => {}, set: (val) => {} })
      const getterProp = firstArg.properties.find(
        (prop: any) => t.isObjectProperty(prop) && t.isIdentifier(prop.key) && prop.key.name === 'get'
      ) as any
      if (
        getterProp &&
        getterProp.value &&
        (t.isArrowFunctionExpression(getterProp.value) || t.isFunctionExpression(getterProp.value))
      ) {
        compCode = t.isArrowFunctionExpression(getterProp.value)
          ? arrowToFunctionString(name, getterProp.value, source)
          : functionExpressionToNamedFunctionString(name, getterProp.value, source)
      } else {
        compCode = sanitizeCodeFromNode(firstArg, source)
      }
    }
  }

  result.computed[name] = { type: 'computed', value: compCode }
  return true
}

function handleVariableDeclarator(name: string, init: any, result: any, source: string) {
  // 1) function-like assignments become methods
  if (addMethodFromFunctionLike(name, init, result, source)) return

  // 2) Check for reactive/ref calls regardless of variable name
  if (isVueReactiveCall(init, 'reactive')) {
    const firstArg = init.arguments && init.arguments[0]
    if (t.isObjectExpression(firstArg)) {
      const stateValue = extractObjectValue(firstArg)
      // For 'state' named variable, expand properties into result.state
      // For other variables, store as a single state item with the variable name as key
      if (name === 'state') {
        Object.entries(stateValue).forEach(([key, value]) => {
          result.state[key] = { type: 'reactive', value }
        })
      } else {
        // Store the entire object under the variable name
        result.state[name] = { type: 'reactive', value: stateValue }
      }
    } else {
      const initCode = getNodeValue(init)
      result.state[name] = { type: 'reactive', value: initCode }
    }
    return
  }

  if (isVueReactiveCall(init, 'ref')) {
    const firstArg = init.arguments && init.arguments[0]
    const value = firstArg ? getNodeValue(firstArg) : undefined
    result.state[name] = { type: 'ref', value }
    return
  }

  // 3) state-only extraction (for backward compatibility with 'state' variable)
  if (assignStateIfNamedState(name, init, result)) return

  // 4) computed regardless of name
  if (assignComputedIfComputed(name, init, result, source)) return

  // 5) handle non-reactive data (plain variables with initial values)
  if (init) {
    const value = getNodeValue(init)
    result.state[name] = { type: 'normal', value }
    return
  }
}

function parseSetupFunctionBody(body: any, result: any, source: string) {
  if (!t.isBlockStatement(body)) return
  const declaredFunctions = new Set<string>()
  const functionBodies: Record<string, string> = {}

  body.body.forEach((statement: any) => {
    if (t.isFunctionDeclaration(statement) && statement.id) declaredFunctions.add(statement.id.name)
  })

  body.body.forEach((statement: any) => {
    if (t.isVariableDeclaration(statement)) {
      statement.declarations.forEach((declaration: any) => {
        if (t.isIdentifier(declaration.id) && declaration.init) {
          const name = declaration.id.name
          handleVariableDeclarator(name, declaration.init, result, source)
        }
      })
    } else if (t.isFunctionDeclaration(statement)) {
      const name = statement.id!.name
      const fnCode = sanitizeCodeFromNode(statement, source)
      functionBodies[name] = fnCode
      routeFunctionLikeByName(result, name, fnCode)
    } else if (t.isExpressionStatement(statement) && t.isCallExpression(statement.expression)) {
      const call = statement.expression
      if (t.isIdentifier(call.callee) && isLifecycleHook(call.callee.name)) {
        const cb = call.arguments && (call.arguments[0] as any)
        let cbCode = 'function() { /* lifecycle hook */ }'
        if (cb) {
          if (t.isArrowFunctionExpression(cb)) cbCode = arrowToFunctionString(call.callee.name, cb, source)
          else if (t.isFunctionExpression(cb))
            cbCode = functionExpressionToNamedFunctionString(call.callee.name, cb, source)
        }
        setLifecycleEntry(result, call.callee.name, cbCode)
      }
    }

    if (t.isReturnStatement(statement) && t.isObjectExpression(statement.argument)) {
      statement.argument.properties.forEach((prop: any) => {
        if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
          const name = prop.key.name
          if (!result.state[name] && !result.computed[name] && declaredFunctions.has(name)) {
            const bodyCode = functionBodies[name] || `function ${name}(){}`
            result.methods[name] = { type: 'function', value: bodyCode }
          } else if (!result.state[name] && !result.methods[name] && !result.computed[name]) {
            result.methods[name] = { type: 'function', value: `function ${name}(){}` }
          }
        }
      })
    }
  })
}

function parseSetupFunction(prop: any, result: any, source: string) {
  if ((t as any).isFunction(prop.value)) parseSetupFunctionBody((prop.value as any).body, result, source)
}

function parseSetupMethod(method: any, result: any, source: string) {
  parseSetupFunctionBody(method.body, result, source)
}

function parsePropsSimple(node: any) {
  if (t.isArrayExpression(node)) {
    return node.elements.map((e: any) => (t.isStringLiteral(e) ? { name: e.value, type: 'any' } : null)).filter(Boolean)
  }
  // 处理对象形式的 props: { title: { type: String, default: '标题一' }, count: Number }
  if (t.isObjectExpression(node)) {
    return node.properties
      .map((prop: any) => {
        if (!t.isObjectProperty(prop) || !t.isIdentifier(prop.key)) return null
        const name = prop.key.name
        // 简写形式: title: String
        if (t.isIdentifier(prop.value)) {
          return { name, type: prop.value.name?.toLowerCase() || 'any' }
        }
        // 对象形式: title: { type: String, default: '标题一' }
        if (t.isObjectExpression(prop.value)) {
          const propDef: any = { name, type: 'any' }
          prop.value.properties.forEach((p: any) => {
            if (!t.isObjectProperty(p) || !t.isIdentifier(p.key)) return
            const key = p.key.name
            if (key === 'type') {
              if (t.isIdentifier(p.value)) propDef.type = p.value.name.toLowerCase()
            } else if (key === 'default') {
              propDef.default = getNodeValue(p.value)
            } else if (key === 'required') {
              propDef.required = getNodeValue(p.value)
            }
          })
          return propDef
        }
        return { name, type: 'any' }
      })
      .filter(Boolean)
  }
  return []
}

function parseMethodsSimple(node: any, source: string) {
  if (!t.isObjectExpression(node)) return {}
  const methods: Record<string, any> = {}
  node.properties.forEach((prop: any) => {
    if (t.isObjectMethod(prop) && t.isIdentifier(prop.key)) {
      const name = prop.key.name
      const code = functionExpressionToNamedFunctionString(name, prop as any, source)
      methods[name] = { type: 'function', value: code || `function ${name}(){}` }
    } else if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
      const name = prop.key.name
      if (t.isFunctionExpression(prop.value)) {
        const code = functionExpressionToNamedFunctionString(name, prop.value, source)
        methods[name] = { type: 'function', value: code || `function ${name}(){}` }
      } else if (t.isArrowFunctionExpression(prop.value)) {
        const code = arrowToFunctionString(name, prop.value, source)
        methods[name] = { type: 'function', value: code }
      } else {
        methods[name] = { type: 'function', value: 'function() {}' }
      }
    }
  })
  return methods
}

function parseComputedSimple(node: any, source: string) {
  if (!t.isObjectExpression(node)) return {}
  const computed: Record<string, any> = {}
  node.properties.forEach((prop: any) => {
    if (t.isObjectMethod(prop) && t.isIdentifier(prop.key)) {
      const name = prop.key.name
      const code = functionExpressionToNamedFunctionString(name, prop as any, source)
      computed[name] = { type: 'computed', value: code || 'function() {}' }
    } else if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
      const name = prop.key.name
      if (t.isFunctionExpression(prop.value)) {
        const code = functionExpressionToNamedFunctionString(name, prop.value, source)
        computed[name] = { type: 'computed', value: code || 'function() {}' }
      } else if (t.isArrowFunctionExpression(prop.value)) {
        const code = arrowToFunctionString(name, prop.value, source)
        computed[name] = { type: 'computed', value: code }
      } else {
        computed[name] = { type: 'computed', value: 'function() {}' }
      }
    }
  })
  return computed
}

function parseOptionsObject(objectExpression: any, result: any, source: string) {
  objectExpression.properties.forEach((prop: any) => {
    if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
      const key = prop.key.name
      switch (key) {
        case 'props':
          result.props = parsePropsSimple(prop.value)
          break
        case 'data':
          result.state = { data: 'function() { return {} }' }
          break
        case 'methods':
          result.methods = parseMethodsSimple(prop.value, source)
          break
        case 'computed':
          result.computed = parseComputedSimple(prop.value, source)
          break
        case 'setup':
          // 解析 setup 函数体提取内部方法/状态
          parseSetupFunction(prop, result, source)
          // 同时将 setup 作为生命周期输出
          {
            const val: any = (prop as any).value
            if (t.isFunctionExpression(val)) {
              const code = functionExpressionToNamedFunctionString('setup', val, source)
              setLifecycleEntry(result, 'setup', code)
            } else if (t.isArrowFunctionExpression(val)) {
              const code = arrowToFunctionString('setup', val, source)
              setLifecycleEntry(result, 'setup', code)
            }
          }
          break
        default:
          if (isLifecycleHook(key)) {
            const val: any = (prop as any).value
            if (t.isFunctionExpression(val)) {
              const code = functionExpressionToNamedFunctionString(key, val, source)
              setLifecycleEntry(result, key, code || 'function() {}')
            } else if (t.isArrowFunctionExpression(val)) {
              const code = arrowToFunctionString(key, val, source)
              setLifecycleEntry(result, key, code)
            } else {
              setLifecycleEntry(result, key, 'function() { /* lifecycle hook */ }')
            }
          }
      }
    } else if (t.isObjectMethod(prop) && t.isIdentifier(prop.key)) {
      const key = prop.key.name
      if (key === 'setup') {
        // 输出 setup 生命周期，并解析其函数体
        const code = functionExpressionToNamedFunctionString('setup', prop, source)
        setLifecycleEntry(result, 'setup', code)
        parseSetupMethod(prop, result, source)
      } else if (isLifecycleHook(key)) {
        const code = functionExpressionToNamedFunctionString(key, prop, source)
        setLifecycleEntry(result, key, code)
      }
    }
  })
}

function parseImports(ast: any, result: any) {
  traverse(ast as any, {
    ImportDeclaration(path: any) {
      result.imports.push({
        source: path.node.source.value,
        specifiers: path.node.specifiers.map((spec: any) => {
          if (t.isImportSpecifier(spec)) {
            return {
              local: spec.local.name,
              imported: t.isIdentifier(spec.imported) ? spec.imported.name : spec.imported.value,
              kind: 'named'
            }
          }

          if (t.isImportNamespaceSpecifier(spec)) {
            return {
              local: spec.local.name,
              imported: '*',
              kind: 'namespace'
            }
          }

          return {
            local: spec.local.name,
            imported: 'default',
            kind: 'default'
          }
        })
      })
    }
  })
}

function parseSetupScript(ast: any, result: any, source: string) {
  traverse(ast as any, {
    VariableDeclaration(path: any) {
      path.node.declarations.forEach((declaration: any) => {
        if (t.isIdentifier(declaration.id) && declaration.init) {
          const name = declaration.id.name
          // 处理 const props = defineProps({...}) 或 const props = defineProps([...])
          if (
            t.isCallExpression(declaration.init) &&
            t.isIdentifier(declaration.init.callee) &&
            declaration.init.callee.name === 'defineProps'
          ) {
            const arg = declaration.init.arguments[0]
            if (arg) {
              result.props = parsePropsSimple(arg)
            }
            return
          }
          handleVariableDeclarator(name, declaration.init, result, source)
        }
      })
    },
    // 处理无赋值的 defineProps({...}) 调用
    ExpressionStatement(path: any) {
      const expr = path.node.expression
      if (t.isCallExpression(expr) && t.isIdentifier(expr.callee) && expr.callee.name === 'defineProps') {
        const arg = expr.arguments[0]
        if (arg) {
          result.props = parsePropsSimple(arg)
        }
      }
    },
    FunctionDeclaration(path: any) {
      const name = path.node.id.name
      const code = sanitizeCodeFromNode(path.node, source)
      routeFunctionLikeByName(result, name, code)
    },
    CallExpression(path: any) {
      const callee = path.node.callee
      let hookName: string | null = null
      if (t.isIdentifier(callee)) hookName = callee.name
      else if (t.isMemberExpression(callee) && t.isIdentifier(callee.property)) hookName = callee.property.name

      if (hookName && isLifecycleHook(hookName)) {
        // 避免 obj.setup() 这类成员调用被误判为生命周期
        if (hookName === 'setup' && !t.isIdentifier(callee)) return
        const cb = path.node.arguments && (path.node.arguments[0] as any)
        let cbCode = 'function() { /* lifecycle hook */ }'
        if (cb) {
          if (t.isArrowFunctionExpression(cb)) cbCode = arrowToFunctionString(hookName, cb, source)
          else if (t.isFunctionExpression(cb)) cbCode = functionExpressionToNamedFunctionString(hookName, cb, source)
        }
        // 若已捕获 setup 的函数体，则不要被调用形式覆盖
        if (hookName === 'setup') setLifecycleEntry(result, hookName, cbCode, { noOverride: true })
        else setLifecycleEntry(result, hookName, cbCode)
      }
    }
  })
}

function parseOptionsAPI(ast: any, result: any, source: string) {
  traverse(ast as any, {
    ExportDefaultDeclaration(path: any) {
      if (t.isObjectExpression(path.node.declaration)) parseOptionsObject(path.node.declaration, result, source)
    }
  })
}

export function parseScript(script: string, options: any = {}) {
  try {
    const ast = parse(script, { sourceType: 'module', plugins: ['typescript', 'jsx'] as any })
    const result = {
      imports: [] as any[],
      usedUtilsImports: [] as any[],
      props: [] as any[],
      emits: [] as any[],
      state: {} as any,
      methods: {} as any,
      computed: {} as any,
      lifeCycles: {} as any
    }
    parseImports(ast, result)
    if (options.isSetup) parseSetupScript(ast, result, script)
    else parseOptionsAPI(ast, result, script)
    rewriteScriptContextInResult(result)
    rewriteImportedUtilsInResult(result)
    return result
  } catch (error: any) {
    return {
      imports: [],
      usedUtilsImports: [],
      props: [],
      emits: [],
      state: {},
      methods: {},
      computed: {},
      lifeCycles: {},
      error: error.message
    }
  }
}
