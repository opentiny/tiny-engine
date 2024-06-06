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
  config: {
    id: 'engine.config',
    theme: 'dark',
    material: [],
  },
  layout: { id: 'engine.layout' },
  toolbars: [
    {
      id: 'engine.toolbars.logo'
    },
    {
      id: 'engine.toolbars.breadcrumb'
    },
    {
      id: 'engine.toolbars.media'
    },
    {
      id: 'engine.toolbars.collaboration'
    },
    {
      id: 'engine.toolbars.clean'
    },
    {
      id: 'engine.toolbars.refresh'
    },
    {
      id: 'engine.toolbars.save'
    },
    {
      id: 'engine.toolbars.generate-vue'
    },
    {
      id: 'engine.toolbars.preview'
    },
    {
      id: 'engine.toolbars.redoundo'
    },
    {
      id: 'engine.toolbars.fullscreen'
    },
    {
      id: 'engine.toolbars.lock'
    },
    {
      id: 'engine.toolbars.setting'
    },
    {
      id: 'engine.toolbars.lang'
    }
  ],
  plugins: [
    {
      id: 'engine.plugins.materials'
    },
    {
      id: 'engine.plugins.outlinetree'
    },
    {
      id: 'engine.plugins.appmanage'
    },
    {
      id: 'engine.plugins.blockmanage'
    },
    {
      id: 'engine.plugins.collections'
    },
    {
      id: 'engine.plugins.bridge'
    },
    {
      id: 'engine.plugins.i18n'
    },
    {
      id: 'engine.plugins.pagecontroller'
    },
    {
      id: 'engine.plugins.state'
    },
    {
      id: 'engine.plugins.schema'
    },
    {
      id: 'engine.plugins.editorhelp'
    },
    {
      id: 'engine.plugins.robot'
    }
  ],
  dsls: [{ id: 'engine.dsls.dslvue' }],
  settings: [
    {
      id: 'engine.setting.props'
    },
    {
      id: 'engine.setting.styles'
    },
    {
      id: 'engine.setting.event'
    }
  ],
  canvas: {},
  utils: { id: 'engine.utils' }
}
