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

const http = useHttp()

const HEADER_LOWCODE_ORG = 'x-lowcode-org'

// 获取页面/区块预览的代码
export const fetchCode = async ({ platform, app, pageInfo, tenant } = {}) =>
  http.post(
    '/app-center/api/schema2code',
    { platform, app, pageInfo },
    {
      headers: { [HEADER_LOWCODE_ORG]: tenant }
    }
  )

// 获取页面依赖的关联应用数据: i18n/dataSource等
export const fetchMetaData = async ({ platform, app, type, id, history, tenant } = {}) =>
  id
    ? http.get('/app-center/api/preview/metadata', {
        headers: { [HEADER_LOWCODE_ORG]: tenant },
        params: { platform, app, type, id, history }
      })
    : {}

// 获取页面列表
export const fetchPageList = (appId) => http.get(`/app-center/api/pages/list/${appId}`)

export const fetchBlockSchema = async (blockName) => http.get(`/material-center/api/block?label=${blockName}`)
