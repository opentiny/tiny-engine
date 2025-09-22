import { z } from 'zod'
import { useCanvas } from '@opentiny/tiny-engine-meta-register'

// 定义函数单元的 zod 结构，用于 lifecycle 与 methods（统一 { type: 'JSFunction', value } 形态）
const funcTypeSchema = z
  .object({
    type: z.literal('JSFunction'),
    value: z.string()
  })
  .describe('Function unit in schema. Must be { type: "JSFunction", value: string }.')

// payload - schema：整量替换或浅合并页面 schema（与 get_page_schema 结果结构一致）
const schemaPayloadSchema = z
  .object({
    schema: z
      .record(z.string(), z.any())
      .describe('Full page schema object. Use tool "get_page_schema" to inspect the current structure before editing.')
  })
  .describe('Payload for section "schema".')

// payload - css：替换整个 css 或在末尾追加（merge=append）
const cssPayloadSchema = z
  .object({
    css: z.string().describe('Full CSS string to apply. replace=overwrite; merge=append to the end.')
  })
  .describe('Payload for section "css".')

// payload - lifeCycles：支持 all（整量）、add/update/remove（部分）
const lifeCyclesPayloadSchema = z
  .object({
    all: z
      .record(z.string(), funcTypeSchema)
      .optional()
      .describe('Full lifecycle map. Prefer with strategy "replace".'),
    add: z
      .record(z.string(), funcTypeSchema)
      .optional()
      .describe('Lifecycle functions to add if the key does not exist.'),
    update: z
      .record(z.string(), funcTypeSchema)
      .optional()
      .describe('Lifecycle functions to replace for existing keys.'),
    remove: z.array(z.string()).optional().describe('Lifecycle names to remove.')
  })
  .describe('Payload for section "lifeCycles". Use add/update/remove for partial edits; use all for wholesale replace.')

// payload - methods：与 lifeCycles 相同
const methodsPayloadSchema = z
  .object({
    all: z.record(z.string(), funcTypeSchema).optional().describe('Full methods map. Prefer with strategy "replace".'),
    add: z.record(z.string(), funcTypeSchema).optional().describe('Methods to add if the key does not exist.'),
    update: z.record(z.string(), funcTypeSchema).optional().describe('Methods to replace for existing keys.'),
    remove: z.array(z.string()).optional().describe('Method names to remove.')
  })
  .describe('Payload for section "methods". Use add/update/remove for partial edits; use all for wholesale replace.')

// payload - state：支持 all（整量）、add/update/remove（部分）。此处合并为顶层键的浅合并
const statePayloadSchema = z
  .object({
    all: z.record(z.string(), z.any()).optional().describe('Full state object. Prefer with strategy "replace".'),
    add: z.record(z.string(), z.any()).optional().describe('Top-level keys to add when not existing.'),
    update: z.record(z.string(), z.any()).optional().describe('Top-level keys to update when existing.'),
    remove: z.array(z.string()).optional().describe('Top-level keys to delete from state.')
  })
  .describe(
    'Payload for section "state". Allows add/update/remove on top-level keys. Values can include JSResource/JSExpression/accessor/etc.'
  )

// 顶层输入结构：判别式入口（section）+ 策略（strategy）+ 载荷（payload）
const inputSchema = z.object({
  section: z
    .enum(['schema', 'css', 'lifeCycles', 'methods', 'state'])
    .describe(
      'Which part of the current page to edit. One of: schema | css | lifeCycles | methods | state. The tool always targets the page currently opened in canvas.'
    ),
  strategy: z
    .enum(['replace', 'merge'])
    .optional()
    .describe(
      'Edit strategy. replace: overwrite the target entirely. merge: partial update. For css, merge means append. For lifeCycles/methods/state, merge means keyed add/update/remove.'
    ),
  payload: z
    .union([schemaPayloadSchema, cssPayloadSchema, lifeCyclesPayloadSchema, methodsPayloadSchema, statePayloadSchema])
    .describe(
      'Payload object for the chosen section. If you are unsure about the current structure, call tool "get_page_schema" first.'
    )
})

//
// Helpers: constants & response builders
//
const ERROR_CODES = {
  INVALID_ARGUMENT: 'INVALID_ARGUMENT',
  INVALID_PAYLOAD: 'INVALID_PAYLOAD',
  UNEXPECTED_ERROR: 'UNEXPECTED_ERROR'
} as const

const nextActionGetSchema = () => [
  { type: 'tool_call', name: 'get_page_schema', args: {}, when: 'you are unsure about current structure' }
]

const ok = (res: Record<string, any>) => ({
  content: [
    {
      type: 'text',
      text: JSON.stringify(res)
    }
  ]
})

const err = (payload: {
  errorCode: string
  reason: string
  userMessage: string
  next_action?: Array<Record<string, any>>
}) => ({
  content: [
    {
      isError: true,
      type: 'text',
      text: JSON.stringify(payload)
    }
  ]
})

//
// Helpers: validators & normalizers
//
const normalizeArgs = (args: any) => {
  const section = args?.section as 'schema' | 'css' | 'lifeCycles' | 'methods' | 'state'
  const strategy = (args?.strategy || 'merge') as 'replace' | 'merge'
  const payload = args?.payload || {}
  return { section, strategy, payload }
}

const isValidJSFuncUnit = (unit: any) => unit && unit.type === 'JSFunction' && typeof unit.value === 'string'

const isNoChange = (affected: { added?: string[]; updated?: string[]; removed?: string[] }) => {
  const a = affected?.added?.length || 0
  const u = affected?.updated?.length || 0
  const r = affected?.removed?.length || 0
  return a === 0 && u === 0 && r === 0
}

//
// Handlers
//
const computeAppendedCss = (oldCss: string, incoming: string) => {
  const base = typeof oldCss === 'string' ? oldCss : ''
  const add = typeof incoming === 'string' ? incoming : ''
  if (!add) return base
  const sep = base && !base.endsWith('\n') ? '\n' : ''
  return `${base}${sep}${add}`
}

const handleCss = (strategy: 'replace' | 'merge', payload: { css?: string }, currentSchema: Record<string, any>) => {
  const warnings: string[] = []
  const css = payload?.css
  if (typeof css !== 'string') {
    return {
      error: {
        errorCode: ERROR_CODES.INVALID_PAYLOAD,
        reason: 'css must be a string',
        userMessage: 'css must be a string',
        next_action: nextActionGetSchema()
      }
    }
  }

  if (strategy === 'replace') {
    return {
      instruction: { type: 'update', partial: { css } },
      result: { message: 'CSS replaced', affectedKeys: { updated: ['css'] }, warnings }
    }
  }

  const nextCss = computeAppendedCss(currentSchema?.css, css)
  if (nextCss === (currentSchema?.css || '')) {
    return { result: { message: 'No change', affectedKeys: {}, warnings } }
  }
  return {
    instruction: { type: 'update', partial: { css: nextCss } },
    result: { message: 'CSS appended', affectedKeys: { updated: ['css'] }, warnings }
  }
}

const handleMapSection = (
  sectionKey: 'lifeCycles' | 'methods',
  strategy: 'replace' | 'merge',
  payload: { all?: Record<string, any>; add?: Record<string, any>; update?: Record<string, any>; remove?: string[] },
  currentMap: Record<string, any>
) => {
  const warnings: string[] = []
  const affected = { added: [] as string[], updated: [] as string[], removed: [] as string[] }

  const invalidKeys: string[] = []
  const validateMap = (map?: Record<string, any>) => {
    if (!map) return
    Object.entries(map).forEach(([k, v]) => {
      if (!isValidJSFuncUnit(v)) invalidKeys.push(k)
    })
  }
  validateMap(payload?.all)
  validateMap(payload?.add)
  validateMap(payload?.update)
  if (invalidKeys.length) warnings.push(`invalid ${sectionKey} function units: ${invalidKeys.join(', ')}`)

  if (strategy === 'replace') {
    if (payload?.all && typeof payload.all === 'object') {
      return {
        instruction: { type: 'update', partial: { [sectionKey]: payload.all } },
        result: {
          message: `${sectionKey} replaced`,
          affectedKeys: { ...affected, updated: Object.keys(payload.all) },
          warnings
        }
      }
    }
    const newMap: Record<string, any> = {}
    const addMap = payload?.add || {}
    const updateMap = payload?.update || {}
    Object.entries(addMap).forEach(([k, v]) => {
      if (isValidJSFuncUnit(v)) newMap[k] = v
    })
    Object.entries(updateMap).forEach(([k, v]) => {
      if (isValidJSFuncUnit(v)) newMap[k] = v
    })
    if (payload?.remove?.length) warnings.push(`remove ignored in replace without all: ${payload.remove.join(', ')}`)
    return {
      instruction: { type: 'update', partial: { [sectionKey]: newMap } },
      result: {
        message: `${sectionKey} rebuilt by add+update`,
        affectedKeys: { added: Object.keys(addMap), updated: Object.keys(updateMap), removed: [] },
        warnings
      }
    }
  }

  // merge
  const nextMap: Record<string, any> = { ...currentMap }
  if (Array.isArray(payload?.remove)) {
    payload.remove.forEach((k) => {
      if (k in nextMap) {
        delete nextMap[k]
        affected.removed.push(k)
      }
    })
  }
  const ignoredAdd: string[] = []
  Object.entries(payload?.add || {}).forEach(([k, v]) => {
    if (k in nextMap) {
      ignoredAdd.push(k)
      return
    }
    if (isValidJSFuncUnit(v)) {
      nextMap[k] = v
      affected.added.push(k)
    }
  })
  const ignoredUpdate: string[] = []
  Object.entries(payload?.update || {}).forEach(([k, v]) => {
    if (!(k in nextMap)) {
      ignoredUpdate.push(k)
      return
    }
    if (isValidJSFuncUnit(v)) {
      nextMap[k] = v
      affected.updated.push(k)
    }
  })
  if (ignoredAdd.length) warnings.push(`ignored add (already exists): ${ignoredAdd.join(', ')}`)
  if (ignoredUpdate.length) warnings.push(`ignored update (not exists): ${ignoredUpdate.join(', ')}`)

  if (isNoChange(affected)) {
    return { result: { message: 'No change', affectedKeys: affected, warnings } }
  }
  return {
    instruction: { type: 'update', partial: { [sectionKey]: nextMap } },
    result: { message: `${sectionKey} merged`, affectedKeys: affected, warnings }
  }
}

const handleState = (
  strategy: 'replace' | 'merge',
  payload: { all?: Record<string, any>; add?: Record<string, any>; update?: Record<string, any>; remove?: string[] },
  currentState: Record<string, any>
) => {
  const warnings: string[] = []
  const affected = { added: [] as string[], updated: [] as string[], removed: [] as string[] }

  if (strategy === 'replace') {
    if (payload?.all && typeof payload.all === 'object') {
      return {
        instruction: { type: 'update', partial: { state: payload.all } },
        result: {
          message: 'state replaced',
          affectedKeys: { ...affected, updated: Object.keys(payload.all) },
          warnings
        }
      }
    }
    const newState: Record<string, any> = {}
    Object.assign(newState, payload?.add || {}, payload?.update || {})
    if (payload?.remove?.length) warnings.push(`remove ignored in replace without all: ${payload.remove.join(', ')}`)
    return {
      instruction: { type: 'update', partial: { state: newState } },
      result: {
        message: 'state rebuilt by add+update',
        affectedKeys: {
          added: Object.keys(payload?.add || {}),
          updated: Object.keys(payload?.update || {}),
          removed: []
        },
        warnings
      }
    }
  }

  // merge top-level only
  const nextState: Record<string, any> = { ...currentState }
  if (Array.isArray(payload?.remove)) {
    payload.remove.forEach((k) => {
      if (k in nextState) {
        delete nextState[k]
        affected.removed.push(k)
      }
    })
  }
  Object.entries(payload?.add || {}).forEach(([k, v]) => {
    if (!(k in nextState)) {
      nextState[k] = v
      affected.added.push(k)
    }
  })
  Object.entries(payload?.update || {}).forEach(([k, v]) => {
    if (k in nextState) {
      nextState[k] = v
      affected.updated.push(k)
    }
  })

  if (isNoChange(affected)) {
    return { result: { message: 'No change', affectedKeys: affected, warnings } }
  }
  return {
    instruction: { type: 'update', partial: { state: nextState } },
    result: { message: 'state merged', affectedKeys: affected, warnings }
  }
}

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

const handleSchema = (
  strategy: 'replace' | 'merge',
  payload: { schema?: Record<string, any> },
  currentSchema: Record<string, any>
) => {
  const warnings: string[] = []
  const provided = payload?.schema
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
  if (strategy === 'replace') {
    return {
      instruction: { type: 'import', schema: provided },
      result: { message: 'schema replaced', affectedKeys: {}, warnings }
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
    return { result: { message: 'No change', affectedKeys: {}, warnings } }
  }
  const prevKeys = new Set(Object.keys(currentSchema || {}))
  const affected = { added: [] as string[], updated: [] as string[], removed: [] as string[] }
  keys.forEach((k) => {
    if (prevKeys.has(k)) affected.updated.push(k)
    else affected.added.push(k)
  })
  return {
    instruction: { type: 'update', partial },
    result: { message: 'schema merged (top-level only)', affectedKeys: affected, warnings }
  }
}

const applyWriteInstruction = (
  instruction: { type?: 'update' | 'import'; partial?: Record<string, any>; schema?: Record<string, any> } | undefined,
  apis: { updateSchema: (p: any) => void; importSchema: (s: any) => void }
) => {
  if (!instruction || !instruction.type) return
  if (instruction.type === 'update') {
    apis.updateSchema(instruction.partial || {})
    return
  }
  if (instruction.type === 'import') {
    apis.importSchema(instruction.schema || {})
  }
}

export const EditPageSchema = {
  name: 'edit_page_schema',
  title: '编辑页面schema',
  description: `Edit the schema of the current page in TinyEngine low-code canvas.
    Supports five sections: schema, css, lifeCycles, methods, and state.
    Use strategy "replace" for whole replacement or "merge" for partial updates (add/update/remove).
    If you are unsure of the current structure, call tool "get_page_schema" first.
    This tool always operates on the page currently opened in canvas.
    Key hints: lifeCycles and methods require function units of the form { type: "JSFunction", value: string };
    state accepts plain values as well as JSResource/JSExpression/computed/accessor (getter/setter) structures;
    css with "merge" appends the given CSS string to the end.
    For fine-grained node tree changes (children structure), prefer node tools such as "add_node" or "change_node_props".
    Be careful: "replace" overwrites existing content.`,
  inputSchema: inputSchema.shape,
  callback: async (args: z.infer<typeof inputSchema>) => {
    const { getSchema, updateSchema, importSchema } = useCanvas()

    try {
      const { section, strategy, payload } = normalizeArgs(args)

      if (!section || !['schema', 'css', 'lifeCycles', 'methods', 'state'].includes(section)) {
        return err({
          errorCode: ERROR_CODES.INVALID_ARGUMENT,
          reason: 'Unknown section',
          userMessage: 'Unknown section',
          next_action: nextActionGetSchema()
        })
      }
      if (strategy !== 'replace' && strategy !== 'merge') {
        return err({
          errorCode: ERROR_CODES.INVALID_ARGUMENT,
          reason: 'Unknown strategy',
          userMessage: 'Unknown strategy',
          next_action: nextActionGetSchema()
        })
      }

      const currentSchema = (getSchema() as Record<string, any>) || {}

      let out: any
      if (section === 'css') {
        out = handleCss(strategy, payload as any, currentSchema)
      } else if (section === 'lifeCycles' || section === 'methods') {
        out = handleMapSection(section, strategy, payload as any, { ...(currentSchema[section] || {}) })
      } else if (section === 'state') {
        out = handleState(strategy, payload as any, { ...(currentSchema.state || {}) })
      } else if (section === 'schema') {
        out = handleSchema(strategy, payload as any, currentSchema)
      } else {
        return err({
          errorCode: ERROR_CODES.INVALID_ARGUMENT,
          reason: 'Unhandled section',
          userMessage: 'Unhandled section',
          next_action: nextActionGetSchema()
        })
      }

      if (out?.error) {
        return err(out.error)
      }

      applyWriteInstruction(out?.instruction, { updateSchema, importSchema })
      const result = out?.result || { message: 'No change', affectedKeys: {}, warnings: [] }
      return ok({ status: 'success', message: result.message, data: { section, strategy, ...result } })
    } catch (e) {
      return err({
        errorCode: ERROR_CODES.UNEXPECTED_ERROR,
        reason: e instanceof Error ? e.message : 'Unknown error',
        userMessage: 'Unexpected error occurred while editing page schema'
      })
    }
  }
}
