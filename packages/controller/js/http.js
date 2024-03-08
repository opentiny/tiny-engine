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

import { useHttp } from '@opentiny/tiny-engine-http'
import usePage from '../src/usePage'
import useCanvas from '../src/useCanvas'
import useNotify from '../src/useNotify'
import { isVsCodeEnv } from './environments'
import { generateRouter, generatePage } from './vscodeGenerateFile'

const http = useHttp()

/**
 * 异常情况埋点上传
 * @param { json } params {"event_type": design_error,"url": "elit in reprehenderit enim incididunt" }
 * @returns { Promise }
 */
export const requestEvent = (params) =>
  http.post('/platform-center/api/platform/monitoring/event', params).catch(() => {})

/**
 * 页面更新
 * @param { string } pageId 页面ID
 * @param { json } params 页面信息
 * @returns { Promise }
 *
 */
export const handlePageUpdate = (pageId, params, routerChange) => {
  return http
    .post(`/app-center/api/pages/update/${pageId}`, params)
    .then((res) => {
      const { pageSettingState } = usePage()
      const { setSaved } = useCanvas()
      if (isVsCodeEnv) {
        generatePage({
          id: pageId,
          name: params.name,
          page_content: params.page_content
        })

        if (routerChange) {
          generateRouter({
            pageId,
            componentsTree: params
          })
        }
      }

      if (routerChange) {
        pageSettingState.updateTreeData()
      }
      pageSettingState.isNew = false
      useNotify({ message: '保存成功!', type: 'success' })

      // 更新 页面状态 标志
      setSaved(true)
      return res
    })
    .catch((err) => {
      useNotify({ title: '保存失败', message: `${err?.message || ''}`, type: 'error' })
    })
}
