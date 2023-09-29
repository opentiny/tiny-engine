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

import { MetaComponents } from '@opentiny/tiny-engine-common'

const widgets = {}
const widgetNames = []

Object.keys(MetaComponents).forEach((name) => {
  if (/meta/i.test(name)) {
    widgets[name] = MetaComponents[name]
    widgetNames.push({ label: name, value: name })
  }
})

export default widgets

export { widgetNames }
