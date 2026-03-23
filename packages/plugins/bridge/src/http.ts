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
/* metaService: engine.plugins.bridge.http */
import { getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'
import { generateBridge, generateUtil } from '@opentiny/tiny-engine-common/js/vscodeGenerateFile'

// 工具管理 -- 获取列表
export const fetchResourceList = (appId: number, type: 'utils' | 'bridge') =>
  getMetaApi(META_SERVICE.Http).get(`/app-center/api/apps/extension/list?app=${appId}&category=${type}`)

// 工具管理 -- 获取详情
export const fetchResourceDetail = () => getMetaApi(META_SERVICE.Http).get(`/app-center/api/apps/extension`)

// 工具管理 -- 新增
export const requestAddReSource = (params: Record<string, any>) =>
  getMetaApi(META_SERVICE.Http).post('/app-center/api/apps/extension/create', params)

// 工具管理 -- 修改
export const requestUpdateReSource = (params: Record<string, any>) =>
  getMetaApi(META_SERVICE.Http).post(`/app-center/api/apps/extension/update`, params)

// 工具管理 -- 删除
export const requestDeleteReSource = (params: string) =>
  getMetaApi(META_SERVICE.Http).get(`/app-center/api/apps/extension/delete?${params}`)

// 本地生成桥接工具类
export const requestGenerateBridgeUtil = (appId) => {
  getMetaApi(META_SERVICE.Http)
    .get(`/app-center/api/apps/schema/${appId}`)
    .then((data) => {
      generateBridge(data.bridge)
      generateUtil(data.utils)
    })
}
