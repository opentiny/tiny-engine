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

export { getMergeMeta, getMetaApi, getOptions, getMergeMetaByType, getAllMergeMeta, mergeRegistry } from './common'
export { useCompile } from './templateHash'
export { defineEntry, callEntry, beforeCallEntry, afterCallEntry, initHotfixRegistry } from './entryHash'
export { default as useMessage } from './useMessage'
export { getConfigurator, addConfigurator } from './configurators'
export * from './hooks'
export { META_APP, META_SERVICE } from './constants'
export { defineService, initServices } from './service'
