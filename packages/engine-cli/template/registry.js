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

export default {
  layout: { id: 'engine.layout' },
  toolbars: [
    {
      id: 'engine.toolbars.download'
    },
    {
      id: 'engine.toolbars.refresh'
    }
  ],
  plugins: [{ id: 'engine.plugins.i18n' }, { id: 'engine.plugins.status' }],
  dsls: [{ id: 'engine.dsls.dslvue' }],
  settings: [],
  canvas: {},
  utils: { id: 'engine.utils' }
}
