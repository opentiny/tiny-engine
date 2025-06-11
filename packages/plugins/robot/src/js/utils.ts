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
