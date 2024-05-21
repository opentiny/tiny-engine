/**
 * Copyright (c) 2024 - present TinyEngine Authors.
 * Copyright (c) 2024 - present Huawei Cloud Computing Technologies Co., Ltd.
 *
 * Use of this source code is governed by an MIT-style license.
 *
 * THE OPEN SOURCE SOFTWARE IN THIS PRODUCT IS DISTRIBUTED IN THE HOPE THAT IT WILL BE USEFUL,
 * BUT WITHOUT ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS FOR
 * A PARTICULAR PURPOSE. SEE THE APPLICABLE LICENSES FOR MORE DETAILS.
 *
 */

import { getMergeMeta } from './src/common'
import { useCompile } from './src/templateHash'
import { defineEntry, callEntry, beforeCallEntry, afterCallEntry, getMergeRegistry } from './src/entryHash'

import { getLayoutComponent } from './src/layoutHash'

export {
  getMergeMeta,
  useCompile,
  defineEntry,
  callEntry,
  beforeCallEntry,
  afterCallEntry,
  getLayoutComponent,
  getMergeRegistry
}
