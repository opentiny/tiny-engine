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

import { isVsCodeEnv } from '@opentiny/tiny-engine-controller/js/environments'
import { useHttp } from '@opentiny/tiny-engine-http'
import { generateDataSource } from '@opentiny/tiny-engine-controller/js/vscodeGenerateFile'

const http = useHttp()

// 数据源管理 -- 获取数据源列表
export const fetchDataSourceList = (appId) => http.get(`/app-center/api/sources/list/${appId}`)

// 数据源管理 -- 新增数据源
export const requestAddDataSource = (params) => http.post('/app-center/api/sources/create', params)

// 数据源管理 -- 删除数据源
export const requestDeleteDataSource = (dataSourceId) => http.get(`/app-center/api/sources/delete/${dataSourceId}`)

// 数据源管理 -- 更新数据源
export const requestUpdateDataSource = (dataSourceId, params) =>
  http.post(`/app-center/api/sources/update/${dataSourceId}`, params)

// 数据源管理 -- 查询数据源详情
export const fetchDataSourceDetail = (dataSourceId) => http.get(`/app-center/api/sources/detail/${dataSourceId}`)

// 数据源管理 -- 获取数据源模板
export const fetchTemplates = (platformId) => http.get(`/app-center/api/source_tpl?platform=${platformId}`)

// 数据源管理 -- 查询数据源模板详情
export const fetchTemplateDetail = (templateId) => http.get(`/app-center/api/source_tpl?id=${templateId}`)

// 数据源管理 -- 设置全局的请求成功后的处理函数
export const requestGlobalDataHandler = (appId, params) => http.post(`/app-center/api/apps/update/${appId}`, params)

// 生成数据源配置到本地文件
export const requestGenerateDataSource = (appId) => {
  if (isVsCodeEnv) {
    http.get(`/app-center/api/apps/schema/${appId}`).then((data) => {
      generateDataSource(data.dataSource)
    })
  }
}
