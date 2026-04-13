function isEscaped(code: string, index: number) {
  let slashCount = 0

  for (let cursor = index - 1; cursor >= 0 && code[cursor] === '\\'; cursor -= 1) {
    slashCount += 1
  }

  return slashCount % 2 === 1
}

function stripOuterParens(code: string) {
  let text = String(code || '').trim()

  while (text.startsWith('(') && text.endsWith(')')) {
    let depth = 0
    let isBalanced = true

    for (let index = 0; index < text.length; index += 1) {
      const char = text[index]
      if (char === '(') depth += 1
      if (char === ')') depth -= 1

      if (depth === 0 && index < text.length - 1) {
        isBalanced = false
        break
      }
    }

    if (!isBalanced) break
    text = text.slice(1, -1).trim()
  }

  return text
}

function findMatchingBracket(code: string, startIndex: number, openChar: string, closeChar: string) {
  let depth = 0
  let quote = ''
  let isTemplate = false

  for (let index = startIndex; index < code.length; index += 1) {
    const char = code[index]

    if (quote) {
      if (char === quote && !isEscaped(code, index)) {
        quote = ''
      }
      continue
    }

    if (isTemplate) {
      if (char === '`' && !isEscaped(code, index)) {
        isTemplate = false
      }
      continue
    }

    if (char === "'" || char === '"') {
      quote = char
      continue
    }

    if (char === '`') {
      isTemplate = true
      continue
    }

    if (char === openChar) {
      depth += 1
      continue
    }

    if (char === closeChar) {
      depth -= 1
      if (depth === 0) return index
    }
  }

  return -1
}

function findTopLevelOperator(code: string, operators: string[]) {
  let parenDepth = 0
  let braceDepth = 0
  let bracketDepth = 0
  let quote = ''
  let isTemplate = false

  for (let index = 0; index < code.length; index += 1) {
    const char = code[index]

    if (quote) {
      if (char === quote && !isEscaped(code, index)) {
        quote = ''
      }
      continue
    }

    if (isTemplate) {
      if (char === '`' && !isEscaped(code, index)) {
        isTemplate = false
      }
      continue
    }

    if (char === "'" || char === '"') {
      quote = char
      continue
    }

    if (char === '`') {
      isTemplate = true
      continue
    }

    if (char === '(') parenDepth += 1
    if (char === ')') parenDepth -= 1
    if (char === '{') braceDepth += 1
    if (char === '}') braceDepth -= 1
    if (char === '[') bracketDepth += 1
    if (char === ']') bracketDepth -= 1

    if (parenDepth !== 0 || braceDepth !== 0 || bracketDepth !== 0) {
      continue
    }

    const matched = operators.find((operator) => code.startsWith(operator, index))
    if (matched) {
      return { index, operator: matched }
    }
  }

  return null
}

function splitTopLevelConditional(code: string) {
  const text = String(code || '')
  let parenDepth = 0
  let braceDepth = 0
  let bracketDepth = 0
  let quote = ''
  let isTemplate = false
  let questionIndex = -1
  let ternaryDepth = 0

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]

    if (quote) {
      if (char === quote && !isEscaped(text, index)) {
        quote = ''
      }
      continue
    }

    if (isTemplate) {
      if (char === '`' && !isEscaped(text, index)) {
        isTemplate = false
      }
      continue
    }

    if (char === "'" || char === '"') {
      quote = char
      continue
    }

    if (char === '`') {
      isTemplate = true
      continue
    }

    if (char === '(') parenDepth += 1
    if (char === ')') parenDepth -= 1
    if (char === '{') braceDepth += 1
    if (char === '}') braceDepth -= 1
    if (char === '[') bracketDepth += 1
    if (char === ']') bracketDepth -= 1

    if (parenDepth !== 0 || braceDepth !== 0 || bracketDepth !== 0) {
      continue
    }

    if (char === '?') {
      if (questionIndex === -1) questionIndex = index
      ternaryDepth += 1
      continue
    }

    if (char === ':' && ternaryDepth > 0) {
      ternaryDepth -= 1
      if (ternaryDepth === 0 && questionIndex !== -1) {
        return {
          test: text.slice(0, questionIndex).trim(),
          consequent: text.slice(questionIndex + 1, index).trim(),
          alternate: text.slice(index + 1).trim()
        }
      }
    }
  }

  return null
}

function getFunctionShape(functionCode: string) {
  const code = stripOuterParens(functionCode)
  if (!code) return null

  const arrowInfo = findTopLevelOperator(code, ['=>'])
  if (arrowInfo) {
    const body = code.slice(arrowInfo.index + arrowInfo.operator.length).trim()
    if (body.startsWith('{')) {
      const bodyEnd = findMatchingBracket(body, 0, '{', '}')
      if (bodyEnd > 0) {
        return {
          type: 'block',
          body: body.slice(1, bodyEnd).trim()
        }
      }
    }

    return {
      type: 'expression',
      body: stripOuterParens(body)
    }
  }

  const functionIndex = code.indexOf('function')
  if (functionIndex !== -1) {
    const bodyStart = code.indexOf('{', functionIndex)
    if (bodyStart !== -1) {
      const bodyEnd = findMatchingBracket(code, bodyStart, '{', '}')
      if (bodyEnd > bodyStart) {
        return {
          type: 'block',
          body: code.slice(bodyStart + 1, bodyEnd).trim()
        }
      }
    }
  }

  return null
}

function findTopLevelKeywordPositions(code: string, keyword: string) {
  const positions: number[] = []
  let parenDepth = 0
  let braceDepth = 0
  let bracketDepth = 0
  let quote = ''
  let isTemplate = false

  for (let index = 0; index < code.length; index += 1) {
    const char = code[index]

    if (quote) {
      if (char === quote && !isEscaped(code, index)) {
        quote = ''
      }
      continue
    }

    if (isTemplate) {
      if (char === '`' && !isEscaped(code, index)) {
        isTemplate = false
      }
      continue
    }

    if (char === "'" || char === '"') {
      quote = char
      continue
    }

    if (char === '`') {
      isTemplate = true
      continue
    }

    if (char === '(') parenDepth += 1
    if (char === ')') parenDepth -= 1
    if (char === '{') braceDepth += 1
    if (char === '}') braceDepth -= 1
    if (char === '[') bracketDepth += 1
    if (char === ']') bracketDepth -= 1

    if (parenDepth !== 0 || braceDepth !== 0 || bracketDepth !== 0) {
      continue
    }

    if (!code.startsWith(keyword, index)) {
      continue
    }

    const before = code[index - 1] || ''
    const after = code[index + keyword.length] || ''
    const isWordBoundaryBefore = !before || !/[A-Za-z0-9_$]/.test(before)
    const isWordBoundaryAfter = !after || !/[A-Za-z0-9_$]/.test(after)

    if (isWordBoundaryBefore && isWordBoundaryAfter) {
      positions.push(index)
      index += keyword.length - 1
    }
  }

  return positions
}

function extractTopLevelReturnExpression(body: string) {
  const returnPositions = findTopLevelKeywordPositions(body, 'return')
  if (returnPositions.length !== 1) return null

  const start = returnPositions[0]
  const expressionStart = start + 'return'.length
  let parenDepth = 0
  let braceDepth = 0
  let bracketDepth = 0
  let quote = ''
  let isTemplate = false
  let end = body.length

  for (let index = expressionStart; index < body.length; index += 1) {
    const char = body[index]

    if (quote) {
      if (char === quote && !isEscaped(body, index)) {
        quote = ''
      }
      continue
    }

    if (isTemplate) {
      if (char === '`' && !isEscaped(body, index)) {
        isTemplate = false
      }
      continue
    }

    if (char === "'" || char === '"') {
      quote = char
      continue
    }

    if (char === '`') {
      isTemplate = true
      continue
    }

    if (char === '(') parenDepth += 1
    if (char === ')') parenDepth -= 1
    if (char === '{') braceDepth += 1
    if (char === '}') braceDepth -= 1
    if (char === '[') bracketDepth += 1
    if (char === ']') bracketDepth -= 1

    if (parenDepth === 0 && braceDepth === 0 && bracketDepth === 0 && char === ';') {
      end = index
      break
    }
  }

  return {
    start,
    end,
    expression: body.slice(expressionStart, end).trim()
  }
}

function getStateReferenceName(expression = '') {
  const match = String(expression || '')
    .trim()
    .match(/^(?:this\.)?state\.([A-Za-z_$][\w$]*)$/)
  return match ? match[1] : ''
}

function inferDefaultValueFromExpression(expression: string, knownDefaults: Map<string, any>): any {
  const text = stripOuterParens(expression)
  if (!text) return undefined

  if (text.startsWith('[') && findMatchingBracket(text, 0, '[', ']') === text.length - 1) return []
  if (text.startsWith('{') && findMatchingBracket(text, 0, '{', '}') === text.length - 1) return {}

  if (/^(['"]).*\1$/.test(text)) {
    return text.slice(1, -1)
  }

  if (text.startsWith('`') && text.endsWith('`')) {
    return text.includes('${') ? '' : text.slice(1, -1)
  }

  if (/^-?\d+(\.\d+)?$/.test(text)) {
    return Number(text)
  }

  if (text === 'true') return true
  if (text === 'false') return false
  if (text === 'null') return null

  if (/^!\s*/.test(text)) return false

  if (/^-\s*\d+(\.\d+)?$/.test(text)) {
    return Number(text.replace(/\s+/g, ''))
  }

  if (/\.\s*length$/.test(text)) return 0

  const stateKey = getStateReferenceName(text)
  if (stateKey && knownDefaults.has(stateKey)) {
    return knownDefaults.get(stateKey)
  }

  if (/\.\s*(filter|map|slice|concat|flat|flatMap)\s*\(/.test(text)) return []
  if (/\.\s*(trim|toLowerCase|toUpperCase|substring|substr)\s*\(/.test(text)) return ''
  if (/\.\s*(includes|startsWith|endsWith|some|every)\s*\(/.test(text)) return false

  const conditional = splitTopLevelConditional(text)
  if (conditional) {
    const consequent = inferDefaultValueFromExpression(conditional.consequent, knownDefaults)
    const alternate = inferDefaultValueFromExpression(conditional.alternate, knownDefaults)

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

  const logicalOperator = findTopLevelOperator(text, ['||', '&&'])
  if (logicalOperator) {
    const left = inferDefaultValueFromExpression(text.slice(0, logicalOperator.index), knownDefaults)
    const right = inferDefaultValueFromExpression(
      text.slice(logicalOperator.index + logicalOperator.operator.length),
      knownDefaults
    )

    if (logicalOperator.operator === '||') return left !== undefined ? left : right
    if (logicalOperator.operator === '&&') return right !== undefined ? right : left
  }

  const comparisonOperator = findTopLevelOperator(text, ['===', '!==', '==', '!=', '>=', '<=', '>', '<'])
  if (comparisonOperator) return false

  const arithmeticOperator = findTopLevelOperator(text, ['+', '-', '*', '/', '%'])
  if (arithmeticOperator) return 0

  return undefined
}

function inferComputedDefaultValue(functionCode: string, knownDefaults: Map<string, any>) {
  const shape = getFunctionShape(functionCode)
  if (!shape) return undefined

  if (shape.type === 'expression') {
    return inferDefaultValueFromExpression(shape.body, knownDefaults)
  }

  const returnInfo = extractTopLevelReturnExpression(shape.body)
  return returnInfo ? inferDefaultValueFromExpression(returnInfo.expression, knownDefaults) : undefined
}

function stabilizeComputedGetterCode(code: string) {
  if (!code) return code

  return code.replace(
    /\b(this\.state\.([A-Za-z_$][\w$]*))\.(reduce|filter|map|slice|concat|flat|flatMap|some|every|find|findIndex)\(/g,
    '($1 || []).$3('
  )
}

function buildComputedGetterValue(key: string, computedValue: string) {
  const shape = getFunctionShape(computedValue)
  const safeComputedValue = stabilizeComputedGetterCode(computedValue)
  const fallbackValue = `function getter() { this.state.${key} = (${safeComputedValue}).call(this) }`

  if (!shape) {
    return fallbackValue
  }

  if (shape.type === 'expression') {
    const body = stabilizeComputedGetterCode(shape.body)
    return body ? `function getter() { this.state.${key} = ${body} }` : fallbackValue
  }

  const returnInfo = extractTopLevelReturnExpression(shape.body)
  if (!returnInfo?.expression) {
    return fallbackValue
  }

  const beforeReturn = shape.body.slice(0, returnInfo.start).trim()
  const getterStatements = [beforeReturn, `this.state.${key} = ${returnInfo.expression}`].filter(Boolean)

  return getterStatements.length
    ? `function getter() { ${stabilizeComputedGetterCode(getterStatements.join('\n'))} }`
    : fallbackValue
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

function normalizeImportedMultiRootSlots(schema: any) {
  const wrapSlotRoots = (value: any) => {
    if (!value || typeof value !== 'object') return value

    if (Array.isArray(value)) {
      value.forEach((item) => wrapSlotRoots(item))
      return value
    }

    if (value.type === 'JSSlot' && Array.isArray(value.value)) {
      value.value.forEach((item: any) => wrapSlotRoots(item))

      if (value.value.length > 1) {
        value.value = [
          {
            componentName: 'div',
            props: {},
            children: value.value
          }
        ]
      }

      return value
    }

    Object.values(value).forEach((item) => {
      if (item && typeof item === 'object') {
        wrapSlotRoots(item)
      }
    })

    return value
  }

  wrapSlotRoots(schema?.children)
  wrapSlotRoots(schema?.methods)
  wrapSlotRoots(schema?.computed)
  wrapSlotRoots(schema?.lifeCycles)
  wrapSlotRoots(schema?.schema)

  return schema
}

export function normalizeImportedSchema(schema: any) {
  normalizeSchemaComputedDefaults(schema)
  normalizeImportedIconStates(schema)
  normalizeImportedMultiRootSlots(schema)
  return schema
}

export function normalizeImportedAppSchema(appSchema: any) {
  if (!appSchema || typeof appSchema !== 'object') return appSchema
  ;(appSchema.pageSchema || []).forEach((schema: any) => normalizeImportedSchema(schema))
  ;(appSchema.blockSchemas || []).forEach((schema: any) => normalizeImportedSchema(schema))

  return appSchema
}

function cloneImportedRuntimeValue(value: any): any {
  if (Array.isArray(value)) {
    return value.map((item) => cloneImportedRuntimeValue(item))
  }

  if (!value || typeof value !== 'object') {
    return value
  }

  if (value.type === 'JSExpression' || value.type === 'JSFunction' || value.type === 'JSSlot') {
    return undefined
  }

  if (Object.prototype.hasOwnProperty.call(value, 'defaultValue')) {
    return cloneImportedRuntimeValue(value.defaultValue)
  }

  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cloneImportedRuntimeValue(item)]))
}

function buildImportedRuntimeState(schemaState: Record<string, any> = {}) {
  return Object.fromEntries(Object.entries(schemaState).map(([key, value]) => [key, cloneImportedRuntimeValue(value)]))
}

function applyHydratedStateBackToSchema(schemaState: Record<string, any> = {}, runtimeState: Record<string, any> = {}) {
  Object.keys(schemaState || {}).forEach((key) => {
    const original = schemaState[key]
    const nextValue = runtimeState[key]

    if (original && typeof original === 'object' && Object.prototype.hasOwnProperty.call(original, 'defaultValue')) {
      original.defaultValue = nextValue
      return
    }

    schemaState[key] = nextValue
  })
}

async function hydrateImportedSchemaState(schema: any) {
  if (!schema || typeof schema !== 'object' || !schema.state || !schema.lifeCycles) return schema

  const mountCode =
    schema.lifeCycles?.onMounted?.value || schema.lifeCycles?.mounted?.value || schema.lifeCycles?.created?.value
  if (!mountCode || typeof mountCode !== 'string') return schema

  const runtimeState = buildImportedRuntimeState(schema.state)
  const globalWindow = (globalThis as any).window
  const originalSetTimeout = globalWindow?.setTimeout
  const instance: Record<string, any> = {
    state: runtimeState,
    props: {},
    utils: {},
    emit: () => undefined,
    Modal: { message: () => undefined }
  }

  if (typeof runtimeState.appItems === 'undefined') {
    runtimeState.appItems = []
  }

  instance.wait = async () => undefined

  const pendingMethods = new Map<string, string>()
  Object.entries(schema.methods || {}).forEach(([key, value]: [string, any]) => {
    const code = value?.value
    if (typeof code === 'string' && code.trim()) {
      pendingMethods.set(key, code)
    }
  })

  let changed = true
  while (pendingMethods.size > 0 && changed) {
    changed = false

    for (const [key, code] of Array.from(pendingMethods.entries())) {
      try {
        const fn = new Function(`return (${code})`)()
        if (typeof fn !== 'function') continue

        instance[key] = fn.bind(instance)
        pendingMethods.delete(key)
        changed = true
      } catch {
        // ignore unresolved helper methods
      }
    }
  }

  try {
    if (globalWindow && typeof globalWindow.setTimeout !== 'function') {
      globalWindow.setTimeout = (handler: any) => {
        handler?.()
        return 0
      }
    }

    const lifecycle = new Function(`return (${mountCode})`)()
    if (typeof lifecycle === 'function') {
      const result = lifecycle.call(instance)
      if (result && typeof result.then === 'function') {
        await result
      }

      await Promise.resolve()
      await Promise.resolve()
    }
  } catch {
    return schema
  } finally {
    if (globalWindow) {
      globalWindow.setTimeout = originalSetTimeout
    }
  }

  applyHydratedStateBackToSchema(schema.state, runtimeState)
  return schema
}

export async function hydrateImportedAppSchemaState(appSchema: any) {
  if (!appSchema || typeof appSchema !== 'object') return appSchema

  for (const schema of appSchema.pageSchema || []) {
    // only hydrate imported pages to avoid executing block-side logic unexpectedly
    await hydrateImportedSchemaState(schema)
  }

  return appSchema
}
