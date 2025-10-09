export const ERROR_CODES = {
  INVALID_ARGUMENT: 'INVALID_ARGUMENT',
  INVALID_PAYLOAD: 'INVALID_PAYLOAD',
  UNEXPECTED_ERROR: 'UNEXPECTED_ERROR'
} as const

export const nextActionGetSchema = () => [
  { type: 'tool_call', name: 'get_page_schema', args: {}, when: 'you are unsure about current structure' }
]

export const isValidJSFuncUnit = (unit: any) => unit?.type === 'JSFunction' && typeof unit?.value === 'string'

export const isNoChange = (affected: { added?: string[]; updated?: string[]; removed?: string[] }) => {
  const a = affected?.added?.length || 0
  const u = affected?.updated?.length || 0
  const r = affected?.removed?.length || 0
  return !a && !u && !r
}
