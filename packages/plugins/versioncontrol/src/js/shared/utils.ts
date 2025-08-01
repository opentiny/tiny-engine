import type { Timestamp } from './type'

type SupportedLocale = 'zh-CN' | 'en-US'

interface MemoizeOptions {
  ttl?: number // 每条缓存的有效期（默认 60 秒）
  maxSize?: number // 缓存最大条目数（默认 100）
}

/**
 * @param timestamp 时间戳
 * @param locale 'zh-CN' | 'en-US'
 * @returns
 */
export function formatDateTime(timestamp: Timestamp, locale: SupportedLocale = 'zh-CN'): string {
  const date = new Date(timestamp)

  const pad = (n: number): string => n.toString().padStart(2, '0')

  const hour = pad(date.getHours())
  const minute = pad(date.getMinutes())
  const second = pad(date.getSeconds())

  switch (locale) {
    case 'zh-CN': {
      const year = date.getFullYear()
      const month = pad(date.getMonth() + 1)
      const day = pad(date.getDate())
      return `${year}-${month}-${day} ${hour}:${minute}:${second}`
    }

    case 'en-US': {
      const datePart = new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(date)
      return `${datePart} ${hour}:${minute}:${second}`
    }

    default:
      return date.toISOString()
  }
}

/**
 * Memoize装饰器 - 支持异步与LRU
 * @param options
 * @returns
 */
export function Memoize(options: MemoizeOptions = {}): MethodDecorator {
  const { ttl = 60000, maxSize = 100 } = options

  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor | void {
    const cache = new Map<string, { value: any; timestamp: number }>()
    const originalMethod = descriptor.value

    descriptor.value = function (...args: any[]) {
      const key = JSON.stringify(args)
      const now = Date.now()

      if (cache.has(key)) {
        const cached = cache.get(key)!
        if (now - cached.timestamp < ttl) {
          // LRU更新
          cache.delete(key)
          cache.set(key, cached)
          return cached.value
        } else {
          cache.delete(key)
        }
      }

      const result = originalMethod.apply(this, args)

      const saveToCache = (resolvedResult: any) => {
        if (cache.size >= maxSize) {
          const oldestKey = cache.keys().next().value!
          cache.delete(oldestKey)
        }
        cache.set(key, { value: resolvedResult, timestamp: now })
      }

      if (result instanceof Promise) {
        return result.then((resolved) => {
          saveToCache(resolved)
          return resolved
        })
      } else {
        saveToCache(result)
        return result
      }
    }

    return descriptor
  }
}
