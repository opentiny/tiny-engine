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

// 资源类型：utils 和 bridge
// utils: 工具类
// bridge: 桥接源
export const RESOURCE_CATEGORY = {
  Util: 'utils',
  Bridge: 'bridge'
} as const

// utils 类型: npm 和 function
export const RESOURCE_TYPE = {
  Npm: 'npm',
  Function: 'function'
} as const
