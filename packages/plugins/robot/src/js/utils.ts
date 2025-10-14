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

export const processSSEStream = (data: string, handler: StreamHandler) => {
  let finishReason: string | undefined
  let latestFinishReason: string | undefined
  const lines = data.split('\n\n')
  lines.pop()

  for (const line of lines) {
    if (line.trim() === '') continue
    if (line.trim() === 'data: [DONE]') {
      if (latestFinishReason) {
        finishReason = latestFinishReason
      }
      handler.onDone(finishReason)
      continue
    }

    try {
      // 解析SSE消息
      const dataMatch = line.match(/^data: (.+)$/m)
      if (!dataMatch) continue

      const data = JSON.parse(dataMatch[1])
      handler.onData(data)
      latestFinishReason = data.choices?.[0]?.finish_reason || undefined
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error parsing SSE message:', error, line)
    }
  }
}
