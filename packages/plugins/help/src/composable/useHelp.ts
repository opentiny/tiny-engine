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

/* metaService: engine.service.help.useHelp */
const getBaseUrl = () => 'https://docs.opentiny.design/tiny-engine/guide/'

const helpState = {
  docsUrl: {
    block: 'block-management',
    bridge: 'using-utils-methods',
    data: 'state-management-and-variable-binding',
    datasource: 'data-source-and-collection-usage',
    i18n: 'internationalization',
    page: 'page-management',
    script: 'js-panel-and-event-binding',
    stylePanel: 'style-settings'
  }
}

type PluginName = keyof typeof helpState['docsUrl']

const getDocsUrl = (plugin: PluginName) => {
  return `${getBaseUrl()}${helpState.docsUrl[plugin]}`
}

export default () => ({
  getBaseUrl,
  getDocsUrl
})
