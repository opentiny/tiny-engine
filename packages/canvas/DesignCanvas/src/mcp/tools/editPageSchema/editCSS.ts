import { useCanvas } from '@opentiny/tiny-engine-meta-register'
import { ERROR_CODES, nextActionGetSchema } from './utils'

const computeAppendedCss = (oldCss: string, incoming: string) => {
  const base = typeof oldCss === 'string' ? oldCss : ''
  const add = typeof incoming === 'string' ? incoming : ''

  if (!add) {
    return base
  }

  const sep = base && !base.endsWith('\n') ? '\n' : ''
  return `${base}${sep}${add}`
}

export const editCSS = (strategy: 'replace' | 'merge', css: string | undefined) => {
  const { getSchema, updateSchema } = useCanvas()
  const currentSchema = (getSchema() as Record<string, any>) || {}

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
    updateSchema({ css })

    return {
      message: 'CSS replaced',
      affectedKeys: {
        updated: ['css']
      }
    }
  }

  const nextCss = computeAppendedCss(currentSchema?.css, css)

  if (nextCss === (currentSchema?.css || '')) {
    return { message: 'No change', affectedKeys: {} }
  }

  updateSchema({ css: nextCss })

  return {
    message: 'CSS appended',
    affectedKeys: { updated: ['css'] }
  }
}
