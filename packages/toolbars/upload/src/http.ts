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

/* metaService: engine.toolbars.upload.http */

import { getMetaApi, getMergeMeta, META_SERVICE } from '@opentiny/tiny-engine-meta-register'

const getResourceRequestMeta = () => ({
  appId: getMetaApi(META_SERVICE.GlobalService).getBaseInfo().id,
  platformId: getMergeMeta('engine.config')?.platformId
})

// 获取页面列表
export const fetchPageList = (appId: string) => getMetaApi(META_SERVICE.Http).get(`/app-center/api/pages/list/${appId}`)

// 获取区块分组列表
export const fetchBlockGroups = (params?: any) =>
  getMetaApi(META_SERVICE.Http).get('/material-center/api/block-groups', { params: { ...params, from: 'block' } })

// 创建区块分组
export const createBlockGroup = (params: any) =>
  getMetaApi(META_SERVICE.Http).post('/material-center/api/block-groups/create', params)

// 创建区块
export const createBlock = (params: any) =>
  getMetaApi(META_SERVICE.Http).post('/material-center/api/block/create', params)

// 根据标签查询区块
export const fetchBlockByLabel = (label: string) =>
  getMetaApi(META_SERVICE.Http).get(`/material-center/api/block?label=${label}`)

// 更新区块
export const updateBlock = (blockId: string, params: any, appId: string) =>
  getMetaApi(META_SERVICE.Http).post(`/material-center/api/block/update/${blockId}`, params, {
    params: { appId }
  })

// 发布区块
export const deployBlock = (params: any) =>
  getMetaApi(META_SERVICE.Http).post('/material-center/api/block/deploy', params)

// 获取工具类列表
export const fetchUtilsResourceList = (appId: string) =>
  getMetaApi(META_SERVICE.Http).get(`/app-center/api/apps/extension/list?app=${appId}&category=utils`)

// 创建工具类
export const createUtilsResource = (params: any) =>
  getMetaApi(META_SERVICE.Http).post('/app-center/api/apps/extension/create', params)

// 更新工具类
export const updateUtilsResource = (params: any) =>
  getMetaApi(META_SERVICE.Http).post('/app-center/api/apps/extension/update', params)

// 获取数据源列表
export const fetchDataSourceList = (appId: string | number) =>
  getMetaApi(META_SERVICE.Http).get(`/app-center/api/sources/list/${appId}`)

// 创建数据源
export const createDataSource = (params: any) =>
  getMetaApi(META_SERVICE.Http).post('/app-center/api/sources/create', params)

// 更新数据源
export const updateDataSource = (dataSourceId: string | number, params: any) =>
  getMetaApi(META_SERVICE.Http).post(`/app-center/api/sources/update/${dataSourceId}`, params)

// 资源管理 - 获取资源分组列表
export const fetchResourceGroups = () =>
  getMetaApi(META_SERVICE.Http).get(
    `/material-center/api/resource-group/${getMetaApi(META_SERVICE.GlobalService).getBaseInfo().id}`
  )

// 资源管理 - 创建资源分组
export const createResourceGroup = (params: any) =>
  getMetaApi(META_SERVICE.Http).post('/material-center/api/resource-group/create', {
    ...params,
    ...getResourceRequestMeta()
  })

// 资源管理 - 获取分组下资源列表
export const fetchResourceListByGroupId = (resourceGroupId: number | string) =>
  getMetaApi(META_SERVICE.Http).get(`/material-center/api/resource/find/${resourceGroupId}`)

// 资源管理 - 批量创建资源
export const batchCreateResource = (params: any[]) =>
  getMetaApi(META_SERVICE.Http).post(
    '/material-center/api/resource/create/batch',
    params.map((item: any) => ({
      ...item,
      ...getResourceRequestMeta()
    }))
  )

export const updateAppConfig = (appId: string | number, params: any) =>
  getMetaApi(META_SERVICE.Http).post(`/app-center/api/apps/update/${appId}`, params)
