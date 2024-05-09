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

export function getConfig(env = import.meta.env) {
  const baseURL = env.VITE_ORIGIN

  // 仅在本地开发时，启用 withCredentials
  const dev = env.MODE?.includes('dev')

  // 获取租户 id
  const getTenant = () => new URLSearchParams(location.search).get('tenant')
  return {
    baseURL,
    withCredentials: false,
    headers: {
      'x-lowcode-mode': dev ? 'develop' : null,
      'x-lowcode-org': getTenant()
    }
  }
}
