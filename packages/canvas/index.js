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
import { CanvasBreadcrumb } from './breadcrumb'
export { createRender } from './render'

// meta app
import CanvasContainer from './container'
import CanvasLayout from './layout'
import DesignCanvas from './DesignCanvas'

export { CanvasContainer, CanvasLayout, DesignCanvas }

export default {
  ...DesignCanvas,
  components: {
    CanvasBreadcrumb
  },
  layout: CanvasLayout,
  metas: [CanvasContainer]
}
