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

export default (dataHandler) => {
  const http = axios(config)

  http.interceptors.response.use(dataHandler, (error) => {
    const response = error.response
    if (response.status === 403 && response.headers && response.headers['x-login-url']) {
      // TODO 处理无权限时，重新登录再发送请求
    }
  })

  return http
}
