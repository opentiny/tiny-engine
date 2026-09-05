import { useCanvas } from '@opentiny/tiny-engine-meta-register'
import { isNoChange } from './utils'

export const editState = (
  strategy: 'replace' | 'merge',
  payload:
    | { all?: Record<string, any>; add?: Record<string, any>; update?: Record<string, any>; remove?: string[] }
    | undefined
) => {
  const warnings: string[] = []
  const affected = { added: [] as string[], updated: [] as string[], removed: [] as string[] }
  const { getSchema, updateSchema } = useCanvas()

  if (strategy === 'replace') {
    if (payload?.all && typeof payload.all === 'object') {
      updateSchema({ state: payload.all })

      return {
        message: 'state replaced',
        affectedKeys: { ...affected, updated: Object.keys(payload.all) }
      }
    }

    const newState: Record<string, any> = {}
    Object.assign(newState, payload?.add || {}, payload?.update || {})

    if (payload?.remove?.length) {
      warnings.push(`remove ignored in replace without all: ${payload.remove.join(', ')}`)
    }

    updateSchema({ state: newState })

    return {
      message: 'state rebuilt by add+update',
      affectedKeys: {
        added: Object.keys(payload?.add || {}),
        updated: Object.keys(payload?.update || {}),
        removed: []
      },
      warnings
    }
  }

  const currentSchema = (getSchema() as Record<string, any>) || {}
  const currentState = currentSchema.state || {}

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
    return { message: 'No change', affectedKeys: affected, warnings }
  }

  updateSchema({ state: nextState })

  return {
    message: 'state merged',
    affectedKeys: affected,
    warnings
  }
}
