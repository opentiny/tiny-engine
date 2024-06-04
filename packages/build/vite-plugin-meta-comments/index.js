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
import { transform } from './src/transform.js'
import { transformSFC } from './src/transform-sfc.js'

export default function () {
  return {
    name: 'vite-plugin-generate-comments',
    enforce: 'pre',
    transform(code, id) {
      if (id.endsWith('.vue')) {
        const result = transformSFC(code, id)
        return result
      }

      if (id.endsWith('.js') || id.endsWith('.jsx') || id.endsWith('.ts')) {
        const result = transform(code, id)
        return result
      }
    }
  }
}
