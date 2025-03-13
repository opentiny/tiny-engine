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

import axios from './axios'
import config from './config'

export default ({ globalWillFetch, globalDataHandle, globalErrorHandler, willFetch, dataHandler, errorHandler }) => {
  const http = axios(config)
  // axios对于request拦截器是后注册先执行
  http.interceptors.request.use(willFetch, errorHandler)
  http.interceptors.request.use(globalWillFetch, globalErrorHandler)
  http.interceptors.response.use(dataHandler, errorHandler)
  http.interceptors.response.use(globalDataHandle, globalErrorHandler)
  return http
}
