import { useCanvas } from '@opentiny/tiny-engine-meta-register'
import { ERROR_CODES, nextActionGetSchema } from './utils'

const ALLOWED_SCHEMA_KEYS = new Set([
  'css',
  'lifeCycles',
  'methods',
  'state',
  'props',
  'fileName',
  'componentName',
  'dataSource',
  'children'
])

export const editSchema = (strategy: 'replace' | 'merge', schema: Record<string, any> | undefined) => {
  const provided = schema

  if (!provided || typeof provided !== 'object') {
    return {
      error: {
        errorCode: ERROR_CODES.INVALID_PAYLOAD,
        reason: 'schema object is required for schema editing',
        userMessage: 'schema object is required for schema editing',
        next_action: nextActionGetSchema()
      }
    }
  }

  const { getSchema, updateSchema, importSchema } = useCanvas()
  const currentSchema = getSchema()

  // 替换整个页面 schema
  if (strategy === 'replace') {
    importSchema(Object.assign({}, currentSchema, provided))

    return {
      message: 'schema replaced'
    }
  }

  const partial: Record<string, any> = {}
  Object.keys(provided).forEach((k) => {
    if (ALLOWED_SCHEMA_KEYS.has(k)) {
      partial[k] = (provided as any)[k]
    }
  })

  const keys = Object.keys(partial)

  if (!keys.length) {
    return { message: 'No change' }
  }

  const prevKeys = new Set(Object.keys(currentSchema || {}))
  const affected = { added: [] as string[], updated: [] as string[], removed: [] as string[] }
  keys.forEach((k) => {
    if (prevKeys.has(k)) {
      affected.updated.push(k)
    } else {
      affected.added.push(k)
    }
  })

  updateSchema(partial)

  return {
    message: 'schema merged (top-level only)',
    affectedKeys: affected
  }
}
