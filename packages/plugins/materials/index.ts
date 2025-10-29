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
import metaData from './meta'
import { ResourceService, MaterialService } from './src/composable/index'
import MaterialLayout from './src/meta/layout/index'
import MaterialBlock from './src/meta/block/index'
import MaterialComponent from './src/meta/component/index'
import MaterialHeader from './src/components/header/Main.vue'
import { basePropertyOptions } from './src/js/options'
import mcp from './src/mcp'
import './src/styles/vars.less'

export default {
  ...metaData,
  entry,
  layout: MaterialLayout,
  options: {
    defaultTabId: 'engine.plugins.materials.component',
    displayComponentIds: ['engine.plugins.materials.component', 'engine.plugins.materials.block'],
    basePropertyOptions,
    useBaseStyle: true,
    blockBaseStyle: {
      className: 'block-base-style',
      style: 'margin: 16px;'
    },
    componentBaseStyle: {
      className: 'component-base-style',
      style: 'margin: 8px;'
    },
    hiddenBuiltinMaterials: []
  },
  components: {
    header: MaterialHeader
  },
  apis: { ...MaterialBlock.apis },
  metas: [MaterialBlock, MaterialComponent, ResourceService, MaterialService],
  mcp
}

export { entry, ResourceService, MaterialService }
export * from './src/composable/types'
