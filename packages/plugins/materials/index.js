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

import entry from './src/Main.vue'
import metaData from './meta.js'
import MaterialLayout from './src/meta/layout'
import MaterialBlock from './src/meta/block'
import MaterialComponent from './src/meta/component'
import MaterialHeader from './src/components/header/Main.vue'
import { ResourceService } from './src/composable'

export default {
  ...metaData,
  entry,
  layout: MaterialLayout,
  options: {
    defaultTabId: 'engine.plugins.materials.component',
    tabComponentIds: ['engine.plugins.materials.component', 'engine.plugins.materials.block']
  },
  components: {
    header: MaterialHeader
  },
  apis: { ...MaterialBlock.apis },
  api: { ...MaterialBlock.apis },
  metas: [MaterialBlock, MaterialComponent, ResourceService]
}

export { entry, ResourceService }
