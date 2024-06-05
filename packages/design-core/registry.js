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

import layoutMeta from '@opentiny/tiny-engine-layout'
import { CanvasContainer, CanvasFooter } from '@opentiny/tiny-engine-canvas'
import addons from './config/addons.js'

export default {
  layout: layoutMeta,
  ...addons,
  canvas: { CanvasContainer, CanvasFooter }
}
