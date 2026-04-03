import { parse as babelParse } from '@babel/parser'

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
  const topLevelReturns = statements.filter(
    (statement: any) => statement?.type === 'ReturnStatement' && statement.argument
  )

  if (topLevelReturns.length !== 1) {
    return fallbackValue
  }

  const getterStatements = statements
    .map((statement: any) => {
      if (statement?.type === 'ReturnStatement' && statement.argument) {
        const returnedCode = getNodeSource(wrappedCode, statement.argument).trim()

        return returnedCode ? `this.state.${key} = ${returnedCode}` : ''
      }

      return getNodeSource(wrappedCode, statement)
    })
    .filter(Boolean)

  if (!getterStatements.length) {
    return fallbackValue
  }

  return `function getter() { ${getterStatements.join('\n')} }`
}

function normalizeSchemaComputedDefaults(schema: any) {
  if (!schema || typeof schema !== 'object' || !schema.state || !schema.computed) return schema

  const defaults = new Map<string, any>()
  Object.entries(schema.state || {}).forEach(([key, value]: [string, any]) => {
    if (value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, 'defaultValue')) {
      defaults.set(key, value.defaultValue)
    }
  })

  Object.keys(schema.computed || {}).forEach((key) => {
    const stateEntry = schema.state?.[key]
    const computedEntry = schema.computed?.[key]
    if (!stateEntry?.accessor?.getter?.value || stateEntry.defaultValue !== undefined || !computedEntry?.value) return

    const inferredDefaultValue = inferComputedDefaultValue(computedEntry.value, defaults)
    if (inferredDefaultValue === undefined) return

    stateEntry.defaultValue = inferredDefaultValue
    defaults.set(key, inferredDefaultValue)
  })

  Object.keys(schema.computed || {}).forEach((key) => {
    const stateEntry = schema.state?.[key]
    const computedEntry = schema.computed?.[key]

    if (!stateEntry?.accessor?.getter || !computedEntry?.value) return

    stateEntry.accessor.getter.value = buildComputedGetterValue(key, computedEntry.value)
  })

  return schema
}

function getIconNameFromStateKey(stateKey: string) {
  if (!/^TinyIcon[A-Z0-9]/.test(stateKey || '')) return ''
  return `Icon${String(stateKey).slice('TinyIcon'.length)}`
}

function isImportedIconStateEntry(entry: any) {
  return (
    entry?.type === 'JSExpression' &&
    typeof entry?.value === 'string' &&
    /^icon[A-Z0-9].*\(\)$/.test(entry.value.trim())
  )
}

function createImportedIconSchema(iconName: string) {
  return {
    componentName: 'Icon',
    props: {
      name: iconName
    }
  }
}

function normalizeImportedIconStates(schema: any) {
  if (!schema || typeof schema !== 'object' || !schema.state) return schema

  const iconStateMap = new Map<string, string>()
  Object.entries(schema.state || {}).forEach(([key, value]: [string, any]) => {
    if (!isImportedIconStateEntry(value)) return

    const iconName = getIconNameFromStateKey(key)
    if (!iconName) return

    iconStateMap.set(key, iconName)
  })

  if (!iconStateMap.size) return schema

  const replaceIconExpression = (value: any) => {
    if (value?.type !== 'JSExpression' || typeof value?.value !== 'string') return value

    const expression = value.value.trim()
    for (const [stateKey, iconName] of iconStateMap.entries()) {
      if (expression === `this.state.${stateKey}` || expression === `state.${stateKey}` || expression === stateKey) {
        return createImportedIconSchema(iconName)
      }
    }

    return value
  }

  const walk = (node: any) => {
    if (!node || typeof node !== 'object') return

    if (Array.isArray(node)) {
      node.forEach(walk)
      return
    }

    if (node.props && typeof node.props === 'object') {
      Object.keys(node.props).forEach((key) => {
        node.props[key] = replaceIconExpression(node.props[key])
      })
    }

    Object.values(node).forEach((item) => {
      if (item && typeof item === 'object') {
        walk(item)
      }
    })
  }

  walk(schema.children)

  const hasStateReference = (value: any, stateKey: string): boolean => {
    if (!value || typeof value !== 'object') return false

    if (Array.isArray(value)) {
      return value.some((item) => hasStateReference(item, stateKey))
    }

    if (
      (value.type === 'JSExpression' || value.type === 'JSFunction') &&
      typeof value.value === 'string' &&
      (value.value.includes(`this.state.${stateKey}`) || value.value.includes(`state.${stateKey}`))
    ) {
      return true
    }

    return Object.values(value).some((item) => hasStateReference(item, stateKey))
  }

  iconStateMap.forEach((_iconName, stateKey) => {
    const stillReferenced =
      hasStateReference(schema.children, stateKey) ||
      hasStateReference(schema.methods, stateKey) ||
      hasStateReference(schema.computed, stateKey) ||
      hasStateReference(schema.lifeCycles, stateKey) ||
      hasStateReference(schema.schema, stateKey)

    if (!stillReferenced) {
      delete schema.state[stateKey]
    }
  })

  return schema
}

export function normalizeImportedSchema(schema: any) {
  normalizeSchemaComputedDefaults(schema)
  normalizeImportedIconStates(schema)
  return schema
}

export function normalizeImportedAppSchema(appSchema: any) {
  if (!appSchema || typeof appSchema !== 'object') return appSchema
  ;(appSchema.pageSchema || []).forEach((schema: any) => normalizeImportedSchema(schema))
  ;(appSchema.blockSchemas || []).forEach((schema: any) => normalizeImportedSchema(schema))

  return appSchema
}
