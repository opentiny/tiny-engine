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

import Breadcrumb from '@opentiny/tiny-engine-toolbar-breadcrumb'
import Fullscreen from '@opentiny/tiny-engine-toolbar-fullscreen'
import Checkinout from '@opentiny/tiny-engine-toolbar-checkinout'
import Logo from '@opentiny/tiny-engine-toolbar-logo'
import Media from '@opentiny/tiny-engine-toolbar-media'
import Redoundo from '@opentiny/tiny-engine-toolbar-redoundo'
import Save from '@opentiny/tiny-engine-toolbar-save'
import Clean from '@opentiny/tiny-engine-toolbar-clean'
import Preview from '@opentiny/tiny-engine-toolbar-preview'
import GenerateVue from '@opentiny/tiny-engine-toolbar-generate-vue'
import Refresh from '@opentiny/tiny-engine-toolbar-refresh'
import Collaboration from '@opentiny/tiny-engine-toolbar-collaboration'
import Setting from '@opentiny/tiny-engine-toolbar-setting'

import Robot from '@opentiny/tiny-engine-plugin-robot'
import DL from 'tiny-engine-plugin-nn'

import Props from '@opentiny/tiny-engine-setting-props'
import Events from '@opentiny/tiny-engine-setting-events'
import Styles from '@opentiny/tiny-engine-setting-styles'

import '@opentiny/tiny-engine-theme'

const addons = {
  plugins: [Robot, DL],
  toolbars: [
    Logo,
    Breadcrumb,
    Media,
    Collaboration,
    Clean,
    Refresh,
    Save,
    GenerateVue,
    Preview,
    Redoundo,
    Fullscreen,
    Checkinout,
    Setting
    // Lang
  ],
  settings: [Props, Styles, Events]
}

export default addons
