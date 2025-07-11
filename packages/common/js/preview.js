/**
 * Copyright (c) 2023 - present TinyEngine Authors.
 * Copyright (c) 2023 - present Huawei Cloud Computing Technologies Co., Ltd.
 *
 * Use of this source code is governed by an MIT-style license.
 *
 * THE OPEN SOURCE SOFTWARE IN THIS PRODUCT IS DISTRIBUTED IN THE HOPE THAT IT WILL BE USEFUL,
 * BUT WITHOUT ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS FOR
 * A PARTICULAR PURPOSE. SEE THE APPLICABLE LICENSES FOR MORE DETAILS.
 *
 */

import { useThrottleFn } from '@vueuse/core'
import {
  useMaterial,
  useResource,
  useMessage,
  useCanvas,
  usePage,
  useBlock,
  getMetaApi,
  META_SERVICE,
  getMergeMeta
} from '@opentiny/tiny-engine-meta-register'
import { utils } from '@opentiny/tiny-engine-utils'
import { isDevelopEnv } from './environments'

const { deepClone } = utils

// 保存预览窗口引用
let previewWindow = null

const getScriptAndStyleDeps = () => {
  const { scripts, styles } = useMaterial().getCanvasDeps()
  const utilsDeps = useResource().getUtilsDeps()

  const scriptsDeps = [...scripts, ...utilsDeps].reduce((res, item) => {
    res[item.package] = res[item.package] || item.script

    return res
  }, {})
  const stylesDeps = [...styles]

  return {
    scripts: scriptsDeps,
    styles: stylesDeps
  }
}

const getSchemaParams = async () => {
  const { isBlock, getPageSchema, getCurrentPage, getSchema } = useCanvas()
  const isBlockPreview = isBlock()
  const { scripts, styles } = getScriptAndStyleDeps()

  if (isBlockPreview) {
    const { getCurrentBlock } = useBlock()
    const block = getCurrentBlock()

    const latestPage = {
      ...block,
      page_content: getSchema()
    }

    return deepClone({
      currentPage: latestPage,
      ancestors: [],
      scripts,
      styles
    })
  }

  const pageSchema = getPageSchema()
  const currentPage = getCurrentPage()
  const { getFamily } = usePage()
  const latestPage = {
    ...currentPage,
    page_content: pageSchema
  }

  const ancestors = await getFamily(latestPage)

  return deepClone({
    currentPage: latestPage,
    ancestors,
    scripts,
    styles
  })
}

// 当 schema 变化时发送更新
const sendSchemaUpdate = (data) => {
  previewWindow.postMessage(
    {
      source: 'designer',
      type: 'schema',
      data
    },
    previewWindow.origin || window.location.origin
  )
}

let hasSchemaChangeListener = false

const cleanupSchemaChangeListener = () => {
  const { unsubscribe } = useMessage()
  unsubscribe({
    topic: 'schemaChange',
    subscriber: 'preview-communication'
  })
  unsubscribe({
    topic: 'schemaImport',
    subscriber: 'preview-communication'
  })
  unsubscribe({
    topic: 'pageOrBlockInit',
    subscriber: 'preview-communication'
  })
  hasSchemaChangeListener = false
}

const handleSchemaChange = async () => {
  // 如果预览窗口不存在或已关闭，则取消订阅
  if (!previewWindow || previewWindow.closed) {
    cleanupSchemaChangeListener()
    previewWindow = null
    return
  }

  const params = await getSchemaParams()
  sendSchemaUpdate(params)
}

// 设置监听 schemaChange 事件，自动发送更新到预览页面
export const setupSchemaChangeListener = () => {
  // 如果已经存在监听，则取消之前的监听
  if (hasSchemaChangeListener) {
    return
  }

  const { subscribe } = useMessage()

  subscribe({
    topic: 'schemaChange',
    subscriber: 'preview-communication',
    // 防抖更新，防止因为属性变化频繁触发
    callback: useThrottleFn(handleSchemaChange, 1000, true)
  })

  subscribe({
    topic: 'schemaImport',
    subscriber: 'preview-communication',
    callback: useThrottleFn(handleSchemaChange, 1000, true)
  })

  subscribe({
    topic: 'pageOrBlockInit',
    subscriber: 'preview-communication',
    callback: handleSchemaChange
  })

  hasSchemaChangeListener = true
}

// 监听来自预览页面的消息
const setupMessageListener = () => {
  window.addEventListener('message', async (event) => {
    const parsedOrigin = new URL(event.origin)
    const parsedHost = new URL(window.location.href)
    // 确保消息来源安全
    if (parsedOrigin.origin === parsedHost.origin || parsedOrigin.host === parsedHost.host) {
      const { event: eventType, source } = event.data || {}
      // 通过 heartbeat 消息来重新建立连接，避免刷新页面后 previewWindow 为 null
      if (source === 'preview' && eventType === 'connect' && !previewWindow) {
        previewWindow = event.source
        setupSchemaChangeListener()
      }

      if (source === 'preview' && eventType === 'onMounted' && previewWindow) {
        const params = await getSchemaParams()
        sendSchemaUpdate(params)
      }
    }
  })

  // 创建 BroadcastChannel 实例用于通信
  const previewChannel = new BroadcastChannel('tiny-engine-preview-channel')

  // 可能是刷新，需要重新建立连接
  previewChannel.postMessage({
    event: 'connect',
    source: 'designer'
  })

  previewChannel.close()
}

// 初始化消息监听
setupMessageListener()

const handleHistoryPreview = (params, url) => {
  let historyPreviewWindow = null
  const handlePreviewReady = (event) => {
    if (event.origin === window.location.origin || event.origin.includes(window.location.hostname)) {
      const { event: eventType, source } = event.data || {}
      if (source === 'preview' && eventType === 'onMounted' && historyPreviewWindow) {
        const { scripts, styles, ancestors = [], ...rest } = params

        historyPreviewWindow.postMessage(
          {
            source: 'designer',
            type: 'schema',
            data: deepClone({
              currentPage: rest,
              ancestors,
              scripts,
              styles
            })
          },
          historyPreviewWindow?.origin || window.location.origin
        )

        // 历史页面不需要实时更新预览，发送完消息后移除监听
        window.removeEventListener('message', handlePreviewReady)
      }
    }
  }

  window.addEventListener('message', handlePreviewReady)

  historyPreviewWindow = window.open(url, '_blank')
}

const getQueryParams = (params = {}, isHistory = false) => {
  const paramsMap = new URLSearchParams(location.search)
  const tenant = paramsMap.get('tenant') || ''
  const pageId = paramsMap.get('pageid')
  const blockId = paramsMap.get('blockid')
  const theme = getMetaApi(META_SERVICE.ThemeSwitch)?.getThemeState()?.theme
  const framework = getMergeMeta('engine.config')?.dslMode
  const platform = getMergeMeta('engine.config')?.platformId

  let query = `tenant=${tenant}&id=${paramsMap.get('id')}&theme=${theme}&framework=${framework}`

  query += `&platform=${platform}`

  if (pageId) {
    query += `&pageid=${pageId}`
  }

  if (blockId) {
    query += `&blockid=${blockId}`
  }

  if (isHistory) {
    query += `&history=${params.history}`
  }

  return query
}

const open = (params = {}, isHistory = false) => {
  const href = window.location.href.split('?')[0] || './'
  const { scripts, styles } = getScriptAndStyleDeps()
  const query = getQueryParams(params, isHistory)

  let openUrl = ''

  // 从预览组件配置获取自定义URL
  const customPreviewUrl = getMergeMeta('engine.toolbars.preview')?.options?.previewUrl
  const defaultPreviewUrl = isDevelopEnv ? `./preview.html` : `${href.endsWith('/') ? href : `${href}/`}preview`

  if (customPreviewUrl) {
    // 如果配置了自定义预览URL，则使用自定义URL
    openUrl =
      typeof customPreviewUrl === 'function'
        ? customPreviewUrl(defaultPreviewUrl, query)
        : `${customPreviewUrl}?${query}`
  } else {
    // 否则使用默认生成的URL
    openUrl = `${defaultPreviewUrl}?${query}`
  }

  if (isHistory) {
    handleHistoryPreview({ ...params, scripts, styles }, openUrl)
    return
  }

  if (previewWindow && !previewWindow.closed) {
    // 如果预览窗口存在，则聚焦预览窗口
    previewWindow.focus()
    return
  }

  // 打开新窗口并保存引用
  previewWindow = window.open(openUrl, '_blank')

  // 设置 schemaChange 事件监听
  setupSchemaChangeListener()
}

export const previewPage = (params = {}, isHistory = false) => {
  open(params, isHistory)
}
