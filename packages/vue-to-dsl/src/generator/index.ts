import { parse as babelParse } from '@babel/parser'
import { defaultComponentsMap } from '../constants'

function parseFunctionExpression(functionCode: string) {
  if (!functionCode || typeof functionCode !== 'string') return null

  try {
    const wrappedCode = `(${functionCode})`
    const ast: any = babelParse(wrappedCode, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx']
    })
    const expression = ast?.program?.body?.[0]?.expression
    if (!expression) return null

    return {
      wrappedCode,
      expression
    }
  } catch (_error) {
    return null
  }
}

function getReturnedExpression(functionCode: string) {
  const parsed = parseFunctionExpression(functionCode)
  const expression = parsed?.expression

  if (!expression) return null

  if (expression.type === 'ArrowFunctionExpression') {
    if (expression.body?.type === 'BlockStatement') {
      const returnStatement = expression.body.body.find(
        (item: any) => item?.type === 'ReturnStatement' && item.argument
      )
      return returnStatement?.argument || null
    }
    return expression.body || null
  }

  if (expression.body?.type === 'BlockStatement') {
    const returnStatement = expression.body.body.find((item: any) => item?.type === 'ReturnStatement' && item.argument)
    return returnStatement?.argument || null
  }

  return null
}

function getNodeSource(code: string, node: any) {
  if (!code || !node || typeof node.start !== 'number' || typeof node.end !== 'number') {
    return ''
  }

  return code.slice(node.start, node.end)
}

function applySourceReplacements(code: string, replacements: Array<{ start: number; end: number; text: string }>) {
  return replacements
    .sort((a, b) => b.start - a.start || b.end - a.end)
    .reduce((output, item) => `${output.slice(0, item.start)}${item.text}${output.slice(item.end)}`, code)
}

function collectComputedReturnReplacements(
  node: any,
  key: string,
  wrappedCode: string,
  replacements: Array<{ start: number; end: number; text: string }>
) {
  if (!node) return

  switch (node.type) {
    case 'BlockStatement':
      node.body?.forEach((statement: any) =>
        collectComputedReturnReplacements(statement, key, wrappedCode, replacements)
      )
      return
    case 'ReturnStatement': {
      if (!node.argument) return
      const returnedCode = getNodeSource(wrappedCode, node.argument).trim()
      if (!returnedCode) return

      replacements.push({
        start: node.start,
        end: node.end,
        text: `this.state.${key} = ${returnedCode}; return`
      })
      return
    }
    case 'IfStatement':
      collectComputedReturnReplacements(node.consequent, key, wrappedCode, replacements)
      collectComputedReturnReplacements(node.alternate, key, wrappedCode, replacements)
      return
    case 'ForStatement':
    case 'ForInStatement':
    case 'ForOfStatement':
    case 'WhileStatement':
    case 'DoWhileStatement':
    case 'LabeledStatement':
    case 'WithStatement':
      collectComputedReturnReplacements(node.body, key, wrappedCode, replacements)
      return
    case 'SwitchStatement':
      node.cases?.forEach((caseNode: any) => {
        caseNode.consequent?.forEach((statement: any) =>
          collectComputedReturnReplacements(statement, key, wrappedCode, replacements)
        )
      })
      return
    case 'TryStatement':
      collectComputedReturnReplacements(node.block, key, wrappedCode, replacements)
      collectComputedReturnReplacements(node.handler?.body, key, wrappedCode, replacements)
      collectComputedReturnReplacements(node.finalizer, key, wrappedCode, replacements)
      return
    default:
      return
  }
}

function buildComputedGetterStatements(key: string, wrappedCode: string, statements: any[]) {
  const replacements: Array<{ start: number; end: number; text: string }> = []
  statements.forEach((statement: any) => collectComputedReturnReplacements(statement, key, wrappedCode, replacements))

  if (!replacements.length) {
    return statements
      .map((statement: any) => getNodeSource(wrappedCode, statement))
      .filter(Boolean)
      .join('\n')
  }

  const bodyStart = statements[0]?.start
  const bodyEnd = statements[statements.length - 1]?.end
  const bodyCode = getNodeSource(wrappedCode, { start: bodyStart, end: bodyEnd })
  const relativeReplacements = replacements
    .filter((item) => typeof item.start === 'number' && typeof item.end === 'number')
    .map((item) => ({
      start: item.start - bodyStart,
      end: item.end - bodyStart,
      text: item.text
    }))

  const getterBody = applySourceReplacements(bodyCode, relativeReplacements)

  return getterBody
}

function getStateReferenceName(node: any) {
  if (!node || node.type !== 'MemberExpression' || node.computed) return ''

  if (node.object?.type === 'Identifier' && node.object.name === 'state' && node.property?.type === 'Identifier') {
    return node.property.name
  }

  if (
    node.object?.type === 'MemberExpression' &&
    !node.object.computed &&
    node.object.object?.type === 'ThisExpression' &&
    node.object.property?.type === 'Identifier' &&
    node.object.property.name === 'state' &&
    node.property?.type === 'Identifier'
  ) {
    return node.property.name
  }

  return ''
}

function inferDefaultValueFromExpression(node: any, knownDefaults: Map<string, any>): any {
  if (!node) return undefined

  switch (node.type) {
    case 'ArrayExpression':
      return []
    case 'ObjectExpression':
      return {}
    case 'StringLiteral':
      return node.value
    case 'TemplateLiteral':
      return node.expressions?.length ? '' : node.quasis?.map((item: any) => item.value?.cooked || '').join('')
    case 'NumericLiteral':
      return node.value
    case 'BooleanLiteral':
      return node.value
    case 'NullLiteral':
      return null
    case 'UnaryExpression':
      if (node.operator === '!' || node.operator === 'delete') return false
      if (node.operator === '-' && node.argument?.type === 'NumericLiteral') return -node.argument.value
      return inferDefaultValueFromExpression(node.argument, knownDefaults)
    case 'MemberExpression': {
      if (!node.computed && node.property?.type === 'Identifier' && node.property.name === 'length') {
        return 0
      }
      const stateKey = getStateReferenceName(node)
      if (stateKey && knownDefaults.has(stateKey)) {
        return knownDefaults.get(stateKey)
      }
      return undefined
    }
    case 'CallExpression': {
      if (
        node.callee?.type === 'MemberExpression' &&
        !node.callee.computed &&
        node.callee.property?.type === 'Identifier'
      ) {
        const methodName = node.callee.property.name
        if (['filter', 'map', 'slice', 'concat', 'flat', 'flatMap'].includes(methodName)) return []
        if (['trim', 'toLowerCase', 'toUpperCase', 'substring', 'substr'].includes(methodName)) return ''
        if (['includes', 'startsWith', 'endsWith', 'some', 'every'].includes(methodName)) return false
      }
      return undefined
    }
    case 'ConditionalExpression': {
      const consequent = inferDefaultValueFromExpression(node.consequent, knownDefaults)
      const alternate = inferDefaultValueFromExpression(node.alternate, knownDefaults)
      if (Array.isArray(consequent) && Array.isArray(alternate)) return []
      if (
        consequent &&
        alternate &&
        typeof consequent === 'object' &&
        typeof alternate === 'object' &&
        !Array.isArray(consequent) &&
        !Array.isArray(alternate)
      ) {
        return {}
      }
      if (typeof consequent === 'number' && typeof alternate === 'number') return 0
      if (typeof consequent === 'string' && typeof alternate === 'string') return ''
      if (typeof consequent === 'boolean' && typeof alternate === 'boolean') return false
      return consequent !== undefined ? consequent : alternate
    }
    case 'LogicalExpression': {
      const left = inferDefaultValueFromExpression(node.left, knownDefaults)
      const right = inferDefaultValueFromExpression(node.right, knownDefaults)
      if (node.operator === '||') return left !== undefined ? left : right
      if (node.operator === '&&') return right !== undefined ? right : left
      return undefined
    }
    case 'BinaryExpression':
      return ['===', '!==', '==', '!=', '>', '>=', '<', '<='].includes(node.operator) ? false : 0
    default:
      return undefined
  }
}

function inferComputedDefaultValue(functionCode: string, knownDefaults: Map<string, any>) {
  const returnedExpression = getReturnedExpression(functionCode)
  return inferDefaultValueFromExpression(returnedExpression, knownDefaults)
}

function buildComputedGetterValue(key: string, computedValue: string) {
  const parsed = parseFunctionExpression(computedValue)
  const expression = parsed?.expression
  const wrappedCode = parsed?.wrappedCode || ''
  const fallbackValue = `function getter() { this.state.${key} = (${computedValue}).call(this) }`

  if (!expression) {
    return fallbackValue
  }

  if (expression.type === 'ArrowFunctionExpression' && expression.body?.type !== 'BlockStatement') {
    const returnedCode = getNodeSource(wrappedCode, expression.body).trim()

    return returnedCode ? `function getter() { this.state.${key} = ${returnedCode} }` : fallbackValue
  }

  if (expression.body?.type !== 'BlockStatement') {
    return fallbackValue
  }

  const statements = expression.body.body
  if (!statements.length) {
    return fallbackValue
  }

  const getterStatements = buildComputedGetterStatements(key, wrappedCode, statements)

  if (!getterStatements || !String(getterStatements).trim()) {
    return fallbackValue
  }

  return `function getter() { ${getterStatements} }`
}
function convertToPlainValue(expr: any) {
  // If it's already an object or array, return as-is (for nested reactive objects)
  if (typeof expr === 'object' && expr !== null) return expr
  if (typeof expr !== 'string') return expr
  const trimmed = expr.trim()
  if (/^['"].*['"]$/.test(trimmed)) return trimmed.slice(1, -1)
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed)
  if (trimmed === 'true') return true
  if (trimmed === 'false') return false
  if (trimmed === 'null') return null
  return trimmed
}

function extractRefPrimitive(expr: any) {
  // If it's already an object or array, return as-is
  if (typeof expr === 'object' && expr !== null) return expr
  if (typeof expr !== 'string') return expr
  const m = expr.match(/^ref\((.*)\)$/)
  if (!m) return expr
  const inner = m[1].trim()
  return convertToPlainValue(inner)
}

function transformState(state: Record<string, any>) {
  const result: Record<string, any> = {}
  Object.keys(state).forEach((key) => {
    const stateItem = state[key]
    if (typeof stateItem === 'object' && stateItem.type) {
      switch (stateItem.type) {
        case 'reactive':
          result[key] = convertToPlainValue(stateItem.value)
          break
        case 'ref':
          result[key] = extractRefPrimitive(stateItem.value)
          break
        default:
          result[key] = stateItem.value || stateItem
      }
    } else {
      result[key] = stateItem
    }
  })
  return result
}

function transformMethods(methods: Record<string, any>) {
  const result: Record<string, any> = {}
  Object.keys(methods).forEach((key) => {
    const method = methods[key]
    if (typeof method === 'object' && method.value) {
      result[key] = { type: 'JSFunction', value: method.value }
    } else if (typeof method === 'string') {
      result[key] = { type: 'JSFunction', value: method }
    } else {
      result[key] = { type: 'JSFunction', value: 'function() { /* method implementation */ }' }
    }
  })
  return result
}

function transformComputed(computed: Record<string, any>) {
  const result: Record<string, any> = {}
  Object.keys(computed).forEach((key) => {
    const computedItem = computed[key]
    if (typeof computedItem === 'object' && computedItem.value) {
      result[key] = { type: 'JSFunction', value: computedItem.value }
    } else if (typeof computedItem === 'string') {
      result[key] = { type: 'JSFunction', value: computedItem }
    } else {
      result[key] = { type: 'JSFunction', value: 'function() { /* computed getter */ }' }
    }
  })
  return result
}

function transformComputedToState(computed: Record<string, any>) {
  const result: Record<string, any> = {}
  const inferredDefaults = new Map<string, any>()

  Object.keys(computed || {}).forEach((key) => {
    const computedItem = computed[key]
    const computedValue =
      typeof computedItem === 'object' && computedItem.value
        ? computedItem.value
        : typeof computedItem === 'string'
        ? computedItem
        : 'function() { return undefined }'
    const defaultValue = inferComputedDefaultValue(computedValue, inferredDefaults)

    inferredDefaults.set(key, defaultValue)

    result[key] = {
      defaultValue,
      accessor: {
        getter: {
          type: 'JSFunction',
          value: buildComputedGetterValue(key, computedValue)
        }
      }
    }
  })

  return result
}

function transformLifeCycles(lifecycle: Record<string, any>) {
  const result: Record<string, any> = {}
  Object.keys(lifecycle).forEach((key) => {
    const lifecycleItem = lifecycle[key]
    if (typeof lifecycleItem === 'object' && lifecycleItem.value) {
      result[key] = { type: 'JSFunction', value: lifecycleItem.value }
    } else if (typeof lifecycleItem === 'string') {
      result[key] = { type: 'JSFunction', value: lifecycleItem }
    } else {
      result[key] = { type: 'JSFunction', value: 'function() { /* lifecycle hook */ }' }
    }
  })
  return result
}

function transformProps(props: any[]) {
  return props.map((prop) => {
    if (typeof prop === 'string') return { name: prop, type: 'any', default: undefined }
    if (typeof prop === 'object')
      return {
        name: prop.name || 'unknownProp',
        type: prop.type || 'any',
        default: prop.default,
        required: prop.required || false
      }
    return prop
  })
}

// Generate an 8-char id with lowercase letters and digits
function generateId(): string {
  let s = ''
  while (s.length < 8) s += Math.random().toString(36).slice(2)
  return s.slice(0, 8)
}

// Recursively assign id to nodes with componentName
function assignComponentIds(node: any): void {
  if (!node || typeof node !== 'object') return
  if (typeof node.componentName === 'string') {
    if (!node.id) node.id = generateId()
  }
  if (Array.isArray(node.children)) node.children.forEach(assignComponentIds)
}

// Deeply sanitize all string values in the schema
function sanitizeSchemaStrings(obj: any): any {
  if (obj === null || obj === undefined) return obj
  if (typeof obj === 'string') return obj
  if (Array.isArray(obj)) return obj.map((v) => sanitizeSchemaStrings(v))
  if (typeof obj === 'object') {
    const out: any = Array.isArray(obj) ? [] : {}
    Object.keys(obj).forEach((k) => {
      out[k] = sanitizeSchemaStrings(obj[k])
    })
    return out
  }
  return obj
}

export async function generateSchema(templateSchema: any[], scriptSchema: any, styleSchema: any, options: any = {}) {
  const fileName = options.fileName || 'UnnamedPage'
  // Capitalize first letter for display name
  const displayName = fileName.charAt(0).toUpperCase() + fileName.slice(1)

  const schema: any = {
    componentName: options.isBlock ? 'Block' : 'Page',
    fileName: fileName,
    meta: {
      name: displayName
    }
  }
  if (scriptSchema) {
    if (scriptSchema.state) schema.state = transformState(scriptSchema.state)
    if (scriptSchema.computed) {
      schema.state = {
        ...(schema.state || {}),
        ...transformComputedToState(scriptSchema.computed)
      }
    }
    if (scriptSchema.methods) schema.methods = transformMethods(scriptSchema.methods)
    // only output computed when computed_flag is explicitly enabled
    if (options.computed_flag === true && scriptSchema.computed) {
      schema.computed = transformComputed(scriptSchema.computed)
    }
    if (scriptSchema.lifeCycles) schema.lifeCycles = transformLifeCycles(scriptSchema.lifeCycles)
    if (scriptSchema.props && scriptSchema.props.length > 0) schema.props = transformProps(scriptSchema.props)
    if (Array.isArray(scriptSchema.emits) && scriptSchema.emits.length > 0) schema.emits = [...scriptSchema.emits]
  }
  if (styleSchema && styleSchema.css) schema.css = styleSchema.css
  if (templateSchema && templateSchema.length > 0) schema.children = templateSchema
  // sanitize all strings to remove newlines in the final output
  const sanitized = sanitizeSchemaStrings(schema)
  // assign 8-char ids to all component nodes (including Page root)
  assignComponentIds(sanitized)
  return sanitized
}

export function generateAppSchema(pageSchemas: any[], options: any = {}) {
  // Ensure all pages have a router path without leading slash
  if (pageSchemas && Array.isArray(pageSchemas)) {
    for (const ps of pageSchemas) {
      if (ps && ps.meta && ps.meta.router && typeof ps.meta.router === 'string') {
        // Remove leading slash from router path
        if (ps.meta.router.startsWith('/')) {
          ps.meta.router = ps.meta.router.slice(1)
        }
      }
    }
  }

  return {
    meta: {
      name: options.name || 'Generated App',
      description: options.description || 'App generated from Vue SFC files'
    },
    i18n: options.i18n || { en_US: {}, zh_CN: {} },
    utils: options.utils || [],
    dataSource: options.dataSource || { list: [] },
    globalState: options.globalState || [],
    pageSchema: pageSchemas || [],
    blockSchemas: options.blockSchemas || [],
    componentsMap: options.componentsMap || defaultComponentsMap
  }
}
