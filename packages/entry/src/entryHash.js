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

import { generateRegistry, entryHashMap } from './common'

const lowcodeRegistry = { registry: null }

export const getMergeRegistry = () => lowcodeRegistry.registry

export const defineEntry = (registry) => {
  if (!registry) {
    throw new Error('请传递正确的注册表')
  }
  lowcodeRegistry.registry = registry
  generateRegistry(registry)
}

export const callEntry = (fn, params) => {
  const { metaData, ctx } = params
  const customMethod = entryHashMap[metaData?.id]
  if (customMethod) {
    const customFn = customMethod.entry ? customMethod.entry : customMethod
    if (typeof customFn === 'function') {
      return customFn(ctx, fn)
    }
  }

  return fn
}

export const beforeCallEntry = ({ metaData, ctx }) => {
  const id = metaData?.id

  const customMethod = entryHashMap[id]?.before
  if (customMethod) {
    customMethod(ctx)
  }
}

export const afterCallEntry = ({ metaData, ctx }) => {
  const id = metaData?.id
  const customMethod = entryHashMap[id]?.after
  if (customMethod) {
    customMethod(ctx)
  }
}
