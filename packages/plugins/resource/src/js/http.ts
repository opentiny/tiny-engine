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

/* metaService: engine.plugins.resource.http */
import { getMetaApi, getMergeMeta, META_SERVICE } from '@opentiny/tiny-engine-meta-register'

const baseUrl = '/material-center/api'
// 资源管理 -- 根据分组ID获取资源列表
export const fetchResourceListByGroupId = (resourceGroupId: number) =>
  getMetaApi(META_SERVICE.Http).get(`${baseUrl}/resource/find/${resourceGroupId}`)

// 资源管理 -- 获取资源列表含模糊查询
export const fetchResourceList = () => getMetaApi(META_SERVICE.Http).get(`${baseUrl}/resource/like`)

// 资源管理 -- 创建资源
export const createResource = (params: any) =>
  getMetaApi(META_SERVICE.Http).post(`${baseUrl}/resource/create`, {
    appId: getMetaApi(META_SERVICE.GlobalService).getBaseInfo().id,
    platformId: getMergeMeta('engine.config')?.platformId,
    ...params
  })

// 资源管理 -- 批量创建资源
export const batchCreateResource = (params: any) =>
  getMetaApi(META_SERVICE.Http).post(
    `${baseUrl}/resource/create/batch`,
    params.map((item: any) => ({
      appId: getMetaApi(META_SERVICE.GlobalService).getBaseInfo().id,
      platformId: getMergeMeta('engine.config')?.platformId,
      ...item
    }))
  )

// 资源管理 -- 删除资源
export const deleteResource = (id: number) => getMetaApi(META_SERVICE.Http).get(`${baseUrl}/resource/delete/${id}`)

// 资源管理 -- 根据appId查询资源分组列表
export const fetchResourceGroupByAppId = () =>
  getMetaApi(META_SERVICE.Http).get(
    `${baseUrl}/resource-group/${getMetaApi(META_SERVICE.GlobalService).getBaseInfo().id}`
  )

// 资源管理 -- 创建资源分组
export const createResourceGroup = (params: any) =>
  getMetaApi(META_SERVICE.Http).post(`${baseUrl}/resource-group/create`, {
    appId: getMetaApi(META_SERVICE.GlobalService).getBaseInfo().id,
    platformId: getMergeMeta('engine.config')?.platformId,
    ...params
  })

// 资源管理 -- 修改资源分组信息-包括删除
export const updateResourceGroup = (id: number, params: any) =>
  getMetaApi(META_SERVICE.Http).put(`${baseUrl}/resource-group/update/${id}`, params)
