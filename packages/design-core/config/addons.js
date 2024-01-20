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

import Logo from '@opentiny/tiny-engine-toolbar-logo'
import Materials from '@opentiny/tiny-engine-plugin-materials'

import Props from '@opentiny/tiny-engine-setting-props'
import Events from '@opentiny/tiny-engine-setting-events'
import Styles from '@opentiny/tiny-engine-setting-styles'

import '@opentiny/tiny-engine-theme'

const addons = {
  plugins: [Materials],

  toolbars: [Logo],
  settings: [Props, Styles, Events]
}

export default addons
