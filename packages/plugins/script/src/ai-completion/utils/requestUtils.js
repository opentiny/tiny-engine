import { HTTP_CONFIG } from '../constants.js'

function createAbortError(message) {
  const error = new Error(message)
  error.name = 'AbortError'
  return error
}

export async function fetchWithTimeout(url, options = {}, timeoutMs = HTTP_CONFIG.REQUEST_TIMEOUT_MS, externalSignal) {
  const controller = new AbortController()
  let timedOut = false
  let timeoutId

  const abortFromExternalSignal = () => {
    if (!controller.signal.aborted) {
      controller.abort()
    }
  }

  if (Number.isFinite(timeoutMs) && timeoutMs > 0) {
    timeoutId = setTimeout(() => {
      timedOut = true
      controller.abort()
    }, timeoutMs)
  }

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort()
    } else {
      externalSignal.addEventListener('abort', abortFromExternalSignal, { once: true })
    }
  }

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    })
  } catch (error) {
    if (controller.signal.aborted && timedOut) {
      throw createAbortError(`Request timed out after ${timeoutMs}ms`)
    }

    if (controller.signal.aborted && externalSignal?.aborted) {
      throw createAbortError('Request aborted')
    }

    throw error
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    externalSignal?.removeEventListener('abort', abortFromExternalSignal)
  }
}
