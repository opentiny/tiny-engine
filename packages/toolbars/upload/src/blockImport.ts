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

    props[key] = value
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
