interface PreviewCommunicationOptions {
  onSchemaReceived: (data: any) => Promise<void>
  loadInitialData: () => Promise<void>
}

let onSchemaReceivedAction: PreviewCommunicationOptions['onSchemaReceived'] | null = null
// 创建 BroadcastChannel 实例，与主页面通信
let previewChannel: BroadcastChannel | null = null

const handleMessage = async (event: MessageEvent) => {
  const parsedOrigin = new URL(event.origin)
  const parsedHost = new URL(window.location.href)

  if (parsedOrigin.origin === parsedHost.origin || parsedOrigin.host === parsedHost.host) {
    const { type, data, source } = event.data || {}

    if (source === 'designer' && type === 'schema' && data && onSchemaReceivedAction) {
      await onSchemaReceivedAction(data)
    }
  }
}

const handleBroadcastMessage = async (event: MessageEvent) => {
  const { event: eventType, source } = event.data || {}
  // 初始化了，重新建立连接
  if (source === 'designer' && eventType === 'connect' && window.opener) {
    window.opener.postMessage({ event: 'connect', source: 'preview' }, window.opener.origin || window.location.origin)
  }
}

let loadInitialData: PreviewCommunicationOptions['loadInitialData'] | null = null

const sendReadyMessage = () => {
  // 尝试获取父窗口引用
  const opener = window.opener

  const fallbackHandler = () => {
    const logger = console
    logger.warn('无法获取主窗口引用，将使用 URL 参数初始化预览')
    loadInitialData?.()
  }

  if (opener) {
    try {
      opener.postMessage({ event: 'onMounted', source: 'preview' }, opener.origin || window.location.origin)
    } catch (error) {
      fallbackHandler()
    }
    return
  }

  fallbackHandler()
}

const cleanupCommunication = () => {
  // 移除消息监听器
  window.removeEventListener('message', handleMessage)

  // 关闭 BroadcastChannel
  if (previewChannel) {
    previewChannel.close()
    previewChannel = null
  }
}

const initCommunication = () => {
  // 注册消息监听器
  window.addEventListener('message', handleMessage)

  // 发送就绪消息给主页面
  sendReadyMessage()

  const isHistory = new URLSearchParams(location.search).get('history')

  if (!isHistory && window.opener) {
    // 初始化 BroadcastChannel
    previewChannel = new BroadcastChannel('tiny-engine-preview-channel')
    previewChannel.onmessage = handleBroadcastMessage
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
