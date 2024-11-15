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

import entry, { api } from './src/Main.vue'
import metaData from './meta.js'
import { BlockService } from './src/composable'
import SaveNewBlock from './src/SaveNewBlock.vue'

export default {
  ...metaData,
  apis: api,
  entry,
  metas: [BlockService],
  options: {
    mergeCategoriesAndGroups: false
  },
  components: {
    SaveNewBlock
  }
}

export { BlockService }
