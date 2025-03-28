interface PreviewCommunicationOptions {
  onSchemaReceived: (data: any) => Promise<void>
  loadInitialData: () => Promise<void>
}

let onSchemaReceivedAction: PreviewCommunicationOptions['onSchemaReceived'] | null = null

const handleMessage = async (event: MessageEvent) => {
  if (event.origin === window.location.origin || event.origin.includes(window.location.hostname)) {
    const { type, data, source } = event.data || {}

    if (source === 'designer' && type === 'schema' && data) {
      if (onSchemaReceivedAction) {
        await onSchemaReceivedAction(data)
      }
    }
  }
}

let heartbeatTimer: ReturnType<typeof setTimeout> | undefined = undefined
let retryTimes = 0
let loadInitialData: PreviewCommunicationOptions['loadInitialData'] | null = null

// 心跳重连，防止主页面刷新之后，丢失子页面实例
const heartbeat = () => {
  const opener = window.opener
  if (retryTimes > 10) {
    clearTimeout(heartbeatTimer)
    return
  }

  if (!opener) {
    retryTimes++
  }

  if (opener) {
    retryTimes = 0
    opener.postMessage({ event: 'heartbeat', source: 'preview' }, '*')
  }

  heartbeatTimer = setTimeout(heartbeat, 1000)
}

const sendReadyMessage = () => {
  // 尝试获取父窗口引用
  const opener = window.opener

  if (opener) {
    opener.postMessage({ event: 'onMounted', source: 'preview' }, '*')
  } else {
    const logger = console
    logger.warn('无法获取主窗口引用，将使用 URL 参数初始化预览')
    loadInitialData?.()
  }
}

const cleanupCommunication = () => {
  // 移除消息监听器
  window.removeEventListener('message', handleMessage)
  clearTimeout(heartbeatTimer)
}

const initCommunication = () => {
  // 注册消息监听器
  window.addEventListener('message', handleMessage)

  // 发送就绪消息给主页面
  sendReadyMessage()

  const isHistory = new URLSearchParams(location.search).get('history')

  if (!isHistory && window.opener) {
    heartbeatTimer = setTimeout(heartbeat, 1000)
  }
}

export const usePreviewCommunication = ({
  onSchemaReceived,
  loadInitialData: loadInitialDataFn
}: PreviewCommunicationOptions) => {
  onSchemaReceivedAction = onSchemaReceived
  loadInitialData = loadInitialDataFn

  return {
    initCommunication,
    cleanupCommunication
  }
}
