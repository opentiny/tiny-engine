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
import { META_SERVICE } from '@opentiny/tiny-engine'
import engineConfig from './engine.config'
import { HttpService } from './src/composable'

export default {
  [META_SERVICE.Http]: HttpService,
  'engine.config': {
    ...engineConfig,
  },
  'engine.plugins.i18n': {
    overwrite: {
      lifeCycles: {
        '': {
          onMounted: [
            (ctx) => () => {
              console.log('overWrite i18n onMounted', ctx.i18nSearchTypes, ctx.currentSearchType.value)
              ctx.currentSearchType.value = ctx.i18nSearchTypes[0].value
            }
          ]
        }
      }
    }
  }
}
