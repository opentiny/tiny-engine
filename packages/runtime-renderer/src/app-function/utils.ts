import type { Util } from '../types/schema'
import { parseJSFunction } from '../utils/data-utils'

interface npmContent {
  package?: string
  version?: string
  exportName?: string
  subName?: string
  destructuring?: boolean
  cdnLink?: string
}

interface fnContent {
  type: string
  value: string
}

const npmCache = new Map<string, any>()
const utilValues = new Map<string, any>()
let initialized = false
let loading = false

async function loadNpmUtil(util: Util) {
  const c = util.content as npmContent
  if (!c.package) return
  if (utilValues.has(util.name)) return

  const key = `${c.package}@${c.version || ''}`
  let mod = npmCache.get(key)
  if (!mod) {
    const url = c.cdnLink || (c.version ? `https://unpkg.com/${pkg}@${c.version}` : `https://unpkg.com/${pkg}`)
    mod = await import(/* @vite-ignore */ url)
    npmCache.set(key, mod)
  }
  let exported: any
  if (c.destructuring) {
    exported = c.exportName ? mod[c.exportName as keyof typeof mod] : mod
  } else {
    exported = (c.exportName && mod[c.exportName]) || mod.default || mod
  }
  if (c.subName && exported) exported = exported[c.subName]
  utilValues.set(util.name, exported)
}

export async function initUtils(utils: Util[] = []) {
  if (initialized || loading) {
    return
  }
  loading = true

  for (const util of utils) {
    if (util.type === 'npm') {
      try {
        await loadNpmUtil(util)
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`加载 npm 包 ${util.name} 失败:`, error)
      }
    } else if (util.type === 'function') {
      const content = util.content as fnContent
      utilValues.set(util.name, parseJSFunction(content))
    }
  }
  initialized = true
  loading = false
}

export function getUtilsAll() {
  return Object.fromEntries(utilValues.entries())
}
