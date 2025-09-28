import { handleSSEStream, type StreamHandler } from '@opentiny/tiny-robot-kit'

export const chatStream = async (requestOpts: any, handler: StreamHandler, headers = {}) => {
  try {
    const { requestData, requestUrl } = requestOpts

    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        ...headers
      },
      body: JSON.stringify(requestData)
    }
    const response = await fetch(requestUrl, requestOptions)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`)
    }

    await handleSSEStream(response, handler)
  } catch (error: unknown) {
    const logger = console
    logger.error('Error in chatStream:', error)
  }
}

export const checkComponentNameExists = (data: any) => {
  if (!data.componentName) {
    return false
  }

  if (data.children && Array.isArray(data.children)) {
    for (const child of data.children) {
      if (!checkComponentNameExists(child)) {
        return false
      }
    }
  }

  return true
}

export const processSSEStream = (data,handler) => {
  const lines = data.split('\n')

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const dataStr = line.substring(6).trim()

      // 检查结束标记
      if (dataStr === '[DONE]') {
        handler.onDone()

        return
      }

      if (dataStr) {
        const data = JSON.parse(dataStr)
        handler.onData(data)
      }
    }
  }
}