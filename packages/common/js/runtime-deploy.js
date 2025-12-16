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

import { getMergeMeta, useNotify, usePage } from '@opentiny/tiny-engine-meta-register'
import { isDevelopEnv } from './environments'

let runtimeWindow = null

const getRuntimeLocation = async () => {
  const paramsMap = new URLSearchParams(location.search)
  const tenant = paramsMap.get('tenant') || ''
  const platform = getMergeMeta('engine.config')?.platformId
  const appId = paramsMap.get('id')
  const queryPageId = paramsMap.get('pageId') || paramsMap.get('pageid') || ''

  const { pageSettingState, getAncestors } = usePage()

  const activePageId = queryPageId
  let routeSegment = ''
  if (activePageId) {
    const chain = ((await getAncestors(String(activePageId), true)) || [])
      .concat(String(activePageId))
      .map((id) => String(id))
    routeSegment = chain
      .map((id) => pageSettingState.treeDataMapping[id]?.route || '')
      .filter(Boolean)
      .map((segment) => segment.replace(/^\/+|\/+$/g, ''))
      .join('/')
  }

  const params = new URLSearchParams()
  if (appId) params.set('id', appId)
  if (tenant) params.set('tenant', tenant)
  if (platform) params.set('platform', platform)

  return {
    query: params.toString(),
    hash: routeSegment ? `#/${routeSegment}` : ''
  }
}

export const deployPage = async () => {
  const href = window.location.href.split('?')[0] || './'
  const { query, hash } = await getRuntimeLocation()

  const customDeployUrl = getMergeMeta('engine.toolbars.runtimeDeploy')?.options?.deployUrl
  const defaultDeployUrl = isDevelopEnv ? `./runtime.html` : `${href.endsWith('/') ? href : `${href}/`}runtime`
  const querySuffix = query ? `?${query}` : ''

  const appendHash = (url) => {
    if (!hash) return url
    return url.includes('#') ? url : `${url}${hash}`
  }

  const buildUrl = (base) => appendHash(`${base}${querySuffix}`)

  let openUrl = ''
  openUrl = customDeployUrl
    ? typeof customDeployUrl === 'function'
      ? appendHash(String(customDeployUrl(defaultDeployUrl, query, hash) || defaultDeployUrl))
      : buildUrl(customDeployUrl)
    : buildUrl(defaultDeployUrl)
  return { openUrl }
}
export const runtimeDeploy = async () => {
  const { openUrl } = await deployPage()

  runtimeWindow = window.open(openUrl, 'tiny-engine-runtime')
  if (!runtimeWindow) {
    useNotify({
      type: 'error',
      title: '运行时窗口打开失败',
      message: '请检查浏览器是否允许新窗口打开'
    })
  }
}
