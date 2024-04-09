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

import Materials from '@opentiny/tiny-engine-plugin-materials'
import Props from '@opentiny/tiny-engine-setting-props'
import Schema from '@opentiny/tiny-engine-plugin-schema'
import Code from 'dl-flow-setting-code'
import Export from 'dl-flow-toolbar-export'
import Save from 'dl-flow-toolbar-save';
import Rename from 'dl-flow-toolbar-rename'
import Menu from 'dl-flow-toolbar-menu';

import '@opentiny/tiny-engine-theme'

const addons = {
  plugins: [Materials, Schema],

  toolbars: [Export, Save, Rename, Menu ],
  settings: [Props, Code]
}

export default addons
