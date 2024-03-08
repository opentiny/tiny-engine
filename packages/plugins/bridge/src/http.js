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
import { generateBridge, generateUtil } from '@opentiny/tiny-engine-controller/js/vscodeGenerateFile'
const http = useHttp()

// 资源管理 -- 获取列表
export const fetchResourceList = (appId, type) =>
  http.get(`/app-center/api/apps/extension/list?app=${appId}&category=${type}`)

// 资源管理 -- 获取资源详情
export const fetchResourceDetail = () => http.get(`/app-center/api/apps/extension`)

// 资源管理 -- 新增
export const requestAddReSource = (params) => http.post('/app-center/api/apps/extension/create', params)

// 资源管理 -- 修改
export const requestUpdateReSource = (params) => http.post(`/app-center/api/apps/extension/update`, params)

// 资源管理 -- 删除
export const requestDeleteReSource = (params) => http.get(`/app-center/api/apps/extension/delete?${params}`)

// 本地生成桥接工具类
export const requestGenerateBridgeUtil = (appId) => {
  http.get(`/app-center/api/apps/schema/${appId}`).then((data) => {
    generateBridge(data.bridge)
    generateUtil(data.utils)
  })
}
