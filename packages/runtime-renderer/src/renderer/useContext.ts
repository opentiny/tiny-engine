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

import { shallowReactive, type ShallowReactive } from 'vue'

interface Context {
  [key: string]: any
}

interface UseContextReturn {
  context: ShallowReactive<Context>
  setContext: (ctx: Context, clear?: boolean) => void
  getContext: () => ShallowReactive<Context>
}

export default (): UseContextReturn => {
  const context = shallowReactive<Context>({})

  const setContext = (ctx: Context, clear?: boolean) => {
    if (clear) {
      Object.keys(context).forEach((key) => delete context[key])
    }
    Object.assign(context, ctx)
  }

  const getContext = () => context

  return {
    context,
    setContext,
    getContext
  }
}
