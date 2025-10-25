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

import { getMergeMeta, useResource, useNotify } from '@opentiny/tiny-engine-meta-register'
import { isDevelopEnv } from './environments'

let runtimeWindow = null
let hasSentGlobalState = false
let hasRuntimeListener = false

const sendGlobalStateToRuntime = () => {
  if (!runtimeWindow || runtimeWindow.closed || hasSentGlobalState) return
  runtimeWindow.postMessage(
    {
      source: 'designer',
      type: 'globalState',
      data: useResource().appSchemaState.globalState
    },
    window.location.origin
  )
  hasSentGlobalState = true
}

const setupRuntimeMessageListener = () => {
  if (hasRuntimeListener) return
  window.addEventListener('message', (event) => {
    const parsedOrigin = new URL(event.origin)
    const parsedHost = new URL(window.location.href)
    if (parsedOrigin.origin !== parsedHost.origin) return

    const { event: eventType, source } = event.data || {}
    if (source === 'runtime' && (eventType === 'connect' || eventType === 'onMounted')) {
      runtimeWindow = event.source || runtimeWindow
      sendGlobalStateToRuntime()
    }
  })
  hasRuntimeListener = true
}

const getQueryParams = () => {
  const paramsMap = new URLSearchParams(location.search)
  const tenant = paramsMap.get('tenant') || ''
  const platform = getMergeMeta('engine.config')?.platformId
  const appId = paramsMap.get('id')

  const params = new URLSearchParams()
  if (appId) params.set('id', appId)
  if (tenant) params.set('tenant', tenant)
  if (platform) params.set('platform', platform)

  return params.toString()
}

export const deployPage = () => {
  const href = window.location.href.split('?')[0] || './'
  const query = getQueryParams()

  const customDeployUrl = getMergeMeta('engine.toolbars.runtimeDeploy')?.options?.deployUrl
  const defaultDeployUrl = isDevelopEnv ? `./runtime.html` : `${href.endsWith('/') ? href : `${href}/`}runtime`

  let openUrl = ''
  openUrl = customDeployUrl
    ? typeof customDeployUrl === 'function'
      ? String(customDeployUrl(defaultDeployUrl, query) || defaultDeployUrl)
      : `${customDeployUrl}?${query}`
    : `${defaultDeployUrl}?${query}`

  return { openUrl }
}

export const runtimeDeploy = async () => {
  const { openUrl } = await deployPage()

  runtimeWindow = window.open(openUrl, 'tiny-engine-runtime')
  hasSentGlobalState = false
  if (!runtimeWindow) {
    useNotify({
      type: 'error',
      title: '运行时窗口打开失败',
      message: '请检查浏览器是否允许新窗口打开'
    })
  } else {
    setupRuntimeMessageListener()
    runtimeWindow.addEventListener('load', sendGlobalStateToRuntime, { once: true })
  }
}
