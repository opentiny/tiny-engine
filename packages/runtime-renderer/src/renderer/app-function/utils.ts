import type { Util } from '../../types/index.ts'
import { parseJSFunction } from '../data-function/index.ts'

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
    const url =
      c.cdnLink || (c.version ? `https://unpkg.com/${c.package}@${c.version}` : `https://unpkg.com/${c.package}`)
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
  try {
    const npmUtils = utils.filter((util) => util.type === 'npm')
    const functionUtils = utils.filter((util) => util.type === 'function')

    // 并行加载npm包
    await Promise.all(
      npmUtils.map(async (util) => {
        try {
          await loadNpmUtil(util)
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error(`加载 npm 包 ${util.name} 错误:`, error)
        }
      })
    )

    // 处理funtion类型的utils
    for (const util of functionUtils) {
      try {
        const content = util.content as fnContent
        utilValues.set(util.name, parseJSFunction(content))
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`加载函数 ${util.name} 错误:`, error)
      }
    }
  } finally {
    initialized = true
    loading = false
  }
}

export function getUtilsAll() {
  return Object.fromEntries(utilValues.entries())
}
