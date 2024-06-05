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

import component from './src/Main.vue'
import metaData from './meta.js'
import MaterialLayout from './src/meta/layout'
import MaterialHeader from './src/meta/header'
import MaterialContent from './src/meta/contentLayout'
import MaterialBlock from './src/meta/block'
import MaterialComponent from './src/meta/component'

export default {
  ...metaData,
  component,
  layout: MaterialLayout,
  options: {
    layoutCompoentIdMap: {
      header: 'engine.plugins.materials.header',
      content: 'engine.plugins.materials.content'
    }
  },
  apis: { ...MaterialBlock.apis },
  metas: [MaterialHeader, MaterialContent, MaterialBlock, MaterialComponent]
}
