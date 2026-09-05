import { useCanvas } from '@opentiny/tiny-engine-meta-register'
import { isValidJSFuncUnit, isNoChange } from './utils'

export const editLifeCycleOrMethod = (
  strategy: 'replace' | 'merge',
  payload:
    | { all?: Record<string, any>; add?: Record<string, any>; update?: Record<string, any>; remove?: string[] }
    | undefined,
  sectionKey: 'lifeCycles' | 'methods'
) => {
  const warnings: string[] = []
  const affected = { added: [] as string[], updated: [] as string[], removed: [] as string[] }
  const { getSchema, updateSchema } = useCanvas()

  if (strategy === 'replace') {
    if (payload?.all && typeof payload.all === 'object') {
      const allMapEntries = Object.entries(payload.all || {})
      const validMap = Object.fromEntries(allMapEntries.filter(([_k, v]) => isValidJSFuncUnit(v)))
      const invalidKeys = allMapEntries.filter(([_k, v]) => !isValidJSFuncUnit(v)).map(([k]) => k)
      const replaceWarnings: string[] = []

      updateSchema({ [sectionKey]: validMap })

      if (invalidKeys.length) {
        replaceWarnings.push(`ignored invalid ${sectionKey} function units: ${invalidKeys.join(', ')}`)
      }

      return {
        message: `${sectionKey} replaced`,
        affectedKeys: { ...affected, updated: Object.keys(validMap) },
        warnings: replaceWarnings
      }
    }

    const newMap: Record<string, any> = {}
    const addMap = payload?.add || {}
    const updateMap = payload?.update || {}
    const invalidReplaceKeys: string[] = []

    Object.entries(addMap).forEach(([k, v]) => {
      if (isValidJSFuncUnit(v)) {
        newMap[k] = v
      } else {
        invalidReplaceKeys.push(k)
      }
    })

    Object.entries(updateMap).forEach(([k, v]) => {
      if (isValidJSFuncUnit(v)) {
        newMap[k] = v
      } else {
        invalidReplaceKeys.push(k)
      }
    })

    if (payload?.remove?.length) {
      warnings.push(`remove ignored in replace without all: ${payload.remove.join(', ')}`)
    }
    if (invalidReplaceKeys.length) {
      warnings.push(`ignored invalid ${sectionKey} function units: ${invalidReplaceKeys.join(', ')}`)
    }

    updateSchema({ [sectionKey]: newMap })

    return {
      message: `${sectionKey} rebuilt by add+update`,
      affectedKeys: { added: Object.keys(addMap), updated: Object.keys(updateMap), removed: [] },
      warnings
    }
  }

  const currentSchema = (getSchema() as Record<string, any>) || {}
  const currentMap = currentSchema[sectionKey] || {}

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

  if (ignoredAdd.length) {
    warnings.push(`ignored add (already exists): ${ignoredAdd.join(', ')}`)
  }

  if (ignoredUpdate.length) {
    warnings.push(`ignored update (not exists): ${ignoredUpdate.join(', ')}`)
  }

  if (isNoChange(affected)) {
    return {
      message: 'No change',
      affectedKeys: affected,
      warnings
    }
  }

  updateSchema({ [sectionKey]: nextMap })

  return {
    message: `${sectionKey} merged`,
    affectedKeys: affected,
    warnings
  }
}
