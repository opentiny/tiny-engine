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

import { getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'

const baseUrl = '/material-center/api'

// 资源管理 -- 根据分组ID获取资源列表
export const fetchResourceListByGroupId = (resourceGroupId: number) =>
  getMetaApi(META_SERVICE.Http).get(`${baseUrl}/resource/find/${resourceGroupId}`)

// 资源管理 -- 根据appId查询资源分组列表
export const fetchResourceGroupByAppId = (appId?: number) =>
  getMetaApi(META_SERVICE.Http).get(
    `${baseUrl}/resource-group/${appId || getMetaApi(META_SERVICE.GlobalService).getBaseInfo().id}`
  )
