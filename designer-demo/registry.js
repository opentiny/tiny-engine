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

import { META_SERVICE, META_APP } from '@opentiny/tiny-engine'
import engineConfig from './engine.config'
import { HttpService } from './src/composable'
import Header from './src/plugins/header'
import ResetDataBase from './src/plugins/resetDatabase'


export default {
  [META_SERVICE.Http]: HttpService,
  [engineConfig.id]: engineConfig,
  [META_APP.Layout]: {
    options: {
      relativeLayoutConfig: {
        [Header.id]: {
          insertBefore: META_APP.Breadcrumb
        },
        [ResetDataBase.id]: {
          insertAfter: META_APP.Save
        }
      }
    }
  },
  [Header.id]: Header,
  [ResetDataBase.id]: ResetDataBase,
  [META_APP.Preview]: {
    options: {
      previewUrl:  ['prod', 'alpha'].includes(import.meta.env.MODE) ? './preview.html' : ''
    }
  },
  // TODO: demo 支持 datasource
  [META_APP.Collections]: false
}
