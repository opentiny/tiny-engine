const BLOCK_EVENT_KEY_PREFIX = 'on'
const BLOCK_EVENT_KEY_PATTERN = /^on(?:[A-Z]|Update:)/

function toPascalCase(input = '') {
  return String(input)
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join('')
}

function isImportedBlockEventBindingKey(key = '') {
  return BLOCK_EVENT_KEY_PATTERN.test(String(key))
}

function toCamelCase(input = '') {
  return String(input).replace(/-([a-zA-Z0-9])/g, (_match, segment) => String(segment).toUpperCase())
}

export function normalizeImportedBlockPropName(propName = '') {
  const raw = String(propName || '').trim()
  if (!raw) return ''
  return toCamelCase(raw)
}

export function toImportedBlockEventKey(eventName = '') {
  const raw = String(eventName || '').trim()
  if (!raw) return ''
  if (isImportedBlockEventBindingKey(raw)) return raw

  if (raw.startsWith('update:')) {
    const [head, ...rest] = raw.split(':')
    return `${BLOCK_EVENT_KEY_PREFIX}${toPascalCase(head)}:${rest.join(':')}`
  }

  return `${BLOCK_EVENT_KEY_PREFIX}${toPascalCase(raw)}`
}

export function splitImportedBlockBindings(bindings: Record<string, any> = {}) {
  const props: Record<string, any> = {}
  const events: Record<string, any> = {}

  Object.entries(bindings || {}).forEach(([key, value]) => {
    if (!key || key === 'key' || key === 'ref') return
    if (isImportedBlockEventBindingKey(key)) {
      events[key] = value
      return
    }

    const normalizedKey = normalizeImportedBlockPropName(key)
    if (!normalizedKey) return
    props[normalizedKey] = value
  })

  return { props, events }
}

export function buildImportedBlockEvents(emits: string[] = [], boundEvents: Record<string, any> = {}) {
  const events: Record<string, any> = {}
  const eventKeys = new Set<string>()

  ;(Array.isArray(emits) ? emits : []).forEach((eventName) => {
    const normalizedKey = toImportedBlockEventKey(eventName)
    if (normalizedKey) eventKeys.add(normalizedKey)
  })

  Object.keys(boundEvents || {}).forEach((key) => {
    if (isImportedBlockEventBindingKey(key)) eventKeys.add(key)
  })

  eventKeys.forEach((key) => {
    events[key] = {
      name: key,
      label: {
        zh_CN: key
      },
      description: {
        zh_CN: key
      }
    }
  })

  return events
}

export function normalizeImportedBlockDefaultValue(value: any) {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object' && value.type === 'JSExpression') {
    return { ...value }
  }
  return value
}

function isImportedBlockLiteralExpression(value = '') {
  const raw = String(value || '').trim()
  if (!raw) return false

  if (/^['"`].*['"`]$/.test(raw)) return true
  if (/^-?\d+(\.\d+)?$/.test(raw)) return true
  if (raw === 'true' || raw === 'false' || raw === 'null') return true
  if ((raw.startsWith('[') && raw.endsWith(']')) || (raw.startsWith('{') && raw.endsWith('}'))) return true

  return false
}

function isImportedBlockDynamicBindingValue(value: any) {
  return (
    value?.type === 'JSExpression' && typeof value?.value === 'string' && !isImportedBlockLiteralExpression(value.value)
  )
}

function isStringLiteralType(raw = '') {
  return /^['"`].*['"`]$/.test(String(raw).trim())
}

function isNumericLiteralType(raw = '') {
  return /^-?\d+(\.\d+)?$/.test(String(raw).trim())
}

function normalizeImportedSingleBlockPropType(raw = '') {
  if (!raw) return ''

  const lowerType = raw.toLowerCase()

  if (['string', 'number', 'boolean', 'array', 'object', 'function'].includes(lowerType)) {
    return lowerType
  }

  if (lowerType === 'any' || lowerType === 'unknown' || lowerType === 'void' || lowerType === 'never') {
    return 'string'
  }

  if (
    lowerType.startsWith('array<') ||
    lowerType.startsWith('readonlyarray<') ||
    lowerType.endsWith('[]') ||
    lowerType.startsWith('tuple')
  ) {
    return 'array'
  }

  if (
    lowerType === 'record' ||
    lowerType.startsWith('record<') ||
    lowerType.startsWith('map<') ||
    lowerType.startsWith('{') ||
    lowerType === 'date'
  ) {
    return 'object'
  }

  if (lowerType.includes('=>') || lowerType.startsWith('(') || lowerType === 'fn') {
    return 'function'
  }

  if (isStringLiteralType(raw)) return 'string'
  if (isNumericLiteralType(raw)) return 'number'
  if (raw === 'true' || raw === 'false') return 'boolean'

  if (/^[A-Z]/.test(raw)) return 'object'

  return 'string'
}

function normalizeImportedUnionType(type = '') {
  const segments = String(type)
    .split('|')
    .map((item) => item.trim())
    .filter((item) => item && item !== 'undefined' && item !== 'null')

  if (!segments.length) return ''
  if (segments.every((item) => item === 'string' || isStringLiteralType(item))) return 'string'
  if (segments.every((item) => item === 'number' || isNumericLiteralType(item))) return 'number'
  if (segments.every((item) => item === 'boolean' || item === 'true' || item === 'false')) return 'boolean'

  const normalizedSegments = segments.map((item) => normalizeImportedSingleBlockPropType(item)).filter(Boolean)
  return normalizedSegments.length === 1 || new Set(normalizedSegments).size === 1 ? normalizedSegments[0] : 'string'
}

export function normalizeImportedBlockPropType(type: any) {
  const raw = String(type || '').trim()
  if (!raw) return ''

  if (raw.toLowerCase().includes('|')) {
    return normalizeImportedUnionType(raw)
  }

  return normalizeImportedSingleBlockPropType(raw)
}

export function inferImportedBlockPropTypeFromValue(value: any) {
  if (value === null || value === undefined) return 'string'
  if (Array.isArray(value)) return 'array'
  if (typeof value === 'object') {
    if (value.type === 'JSExpression') return 'string'
    if (value.type === 'JSFunction') return 'function'
    return 'object'
  }

  if (['string', 'number', 'boolean', 'function'].includes(typeof value)) {
    return typeof value
  }

  return 'string'
}

export function resolveImportedBlockPropType(declaredType: any, value: any) {
  const normalizedDeclaredType = normalizeImportedBlockPropType(declaredType)
  if (normalizedDeclaredType) return normalizedDeclaredType
  return inferImportedBlockPropTypeFromValue(value)
}

export function resolveImportedBlockDefaultValue(declaredDefault: any, value: any) {
  if (isImportedBlockDynamicBindingValue(value)) return ''
  if (value !== undefined) return normalizeImportedBlockDefaultValue(value)
  if (declaredDefault !== undefined) return normalizeImportedBlockDefaultValue(declaredDefault)
  return ''
}
