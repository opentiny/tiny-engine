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

// 区块管理 -- 获取区块列表
export const fetchBlockList = (params) => http.get('/material-center/api/blocks', { params })

// 删除区块
export const requestDeleteBlock = (blockId) => http.get(`/material-center/api/block/delete/${blockId}`)

// 区块管理 -- 保存区块
export const requestUpdateBlock = (blockId, params, config = {}) =>
  http.post(`/material-center/api/block/update/${blockId}`, params, config)

// 区块管理 -- 发布区块
export const requestDeployBlock = (params) => http.post('/material-center/api/block/deploy/', params)

// 区块管理 -- 查询区块发布进度
export const fetchDeployProgress = (taskId) => http.get(`/material-center/api/tasks/${taskId}`)

// 区块管理 -- 根据关键字搜索区块
export const requestSearchBlock = (searchKey) => http.get(`/material-center/api/block?label_contains=${searchKey}`)

// 区块管理 -- 根据区块ID获取区块历史备份列表
export const fetchBackupList = (blockId) => http.get(`/material-center/api/block-history?block=${blockId}`)

// 区块管理 -- 新建区块
export const requestCreateBlock = (params) => http.post('/material-center/api/block/create/', params)

// 初始化区块
export const requestInitBlocks = (params) => http.post('/generate/api/initBlocks', params)

// 获取所有区块
export const requestBlocks = () => http.get(`/material-center/api/block`)

// 区块管理 -- 查询单个区块详情
export const fetchBlockContent = (blockId) => http.get(`/material-center/api/block/detail/${blockId}`)

// 区块管理 -- 根据label查询单个区块详情
export const fetchBlockContentByLabel = (label) => http.get(`/material-center/api/block?label=${label}`)

// 获取应用下的 ComponentsMap
export const fetchComponentsMap = (appId) => http.get(`/app-center/api/apps/schema/components/${appId}`)

// 区块分类列表
export const fetchCategories = (params) => http.get('/material-center/api/block-categories', { params })

// 更新区块分类
export const updateCategory = ({ id, ...params }) => http.put(`/material-center/api/block-categories/${id}`, params)

// 新建区块分类
export const createCategory = (params) => http.post(`/material-center/api/block-categories`, params)

// 删除区块分类
export const deleteCategory = (id) => http.delete(`/material-center/api/block-categories/${id}`)
