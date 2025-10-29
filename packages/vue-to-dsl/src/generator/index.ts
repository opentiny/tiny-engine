import { defaultComponentsMap } from '../constants'
function convertToPlainValue(expr: any) {
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
  const schema: any = {
    componentName: 'Page',
    fileName: options.fileName || 'UnnamedPage',
    meta: {
      name: options.fileName || 'UnnamedPage'
    }
  }
  if (scriptSchema) {
    if (scriptSchema.state) schema.state = transformState(scriptSchema.state)
    if (scriptSchema.methods) schema.methods = transformMethods(scriptSchema.methods)
    // only output computed when computed_flag is explicitly enabled
    if (options.computed_flag === true && scriptSchema.computed) {
      schema.computed = transformComputed(scriptSchema.computed)
    }
    if (scriptSchema.lifeCycles) schema.lifeCycles = transformLifeCycles(scriptSchema.lifeCycles)
    if (scriptSchema.props && scriptSchema.props.length > 0) schema.props = transformProps(scriptSchema.props)
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
    componentsMap: options.componentsMap || defaultComponentsMap
  }
}
