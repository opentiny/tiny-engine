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
export { createRender } from './render'
export { CanvasDragItem } from './drag-drop'

// meta app
import CanvasBreadcrumb from './breadcrumb'
import CanvasContainer from './container'
import DesignCanvas from './DesignCanvas'

export default {
  ...DesignCanvas,
  metas: [CanvasContainer, CanvasBreadcrumb]
}
