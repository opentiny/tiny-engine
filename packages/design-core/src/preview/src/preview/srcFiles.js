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

import appVue from './srcFiles/App.vue?raw'
import injectGlobalJS from './srcFiles/injectGlobal.js?raw'
import constantJS from './srcFiles/constant/index.js?raw'
import appJS from './srcFiles/app.js?raw'
import mainVue from './srcFiles/Main.vue?raw'
import lowcodeJS from './srcFiles/lowcode.js?raw'
import dataSourceMapJS from './srcFiles/dataSourceMap.js?raw'
import dataSourceJS from './srcFiles/dataSource.js?raw'
import utilsJS from './srcFiles/utils.js?raw'
import bridgeJS from './srcFiles/bridge.js?raw'
import localesJS from './srcFiles/locales.js?raw'
import storesJS from './srcFiles/stores.js?raw'
import storesHelperJS from './srcFiles/storesHelper.js?raw'

const srcFiles = {}

srcFiles['App.vue'] = appVue
srcFiles['Main.vue'] = mainVue
srcFiles['constant.js'] = constantJS
srcFiles['app.js'] = appJS.replace(/VITE_CDN_DOMAIN/g, import.meta.env.VITE_CDN_DOMAIN)
srcFiles['injectGlobal.js'] = injectGlobalJS
srcFiles['lowcode.js'] = lowcodeJS
srcFiles['dataSourceMap.js'] = dataSourceMapJS
srcFiles['dataSource.js'] = dataSourceJS
srcFiles['utils.js'] = utilsJS
srcFiles['bridge.js'] = bridgeJS
srcFiles['locales.js'] = localesJS
srcFiles['stores.js'] = storesJS
srcFiles['storesHelper.js'] = storesHelperJS

export const genPreviewTemplate = () => {
  return [
    {
      fileName: 'App.vue',
      path: '',
      fileContent: appVue
    },
    {
      fileName: 'constant.js',
      path: '',
      fileContent: constantJS
    },
    {
      fileName: 'app.js',
      path: '',
      fileContent: appJS.replace(/VITE_CDN_DOMAIN/g, import.meta.env.VITE_CDN_DOMAIN)
    },
    {
      fileName: 'injectGlobal.js',
      path: '',
      fileContent: injectGlobalJS
    },
    {
      fileName: 'lowcode.js',
      path: '',
      fileContent: lowcodeJS
    },
    {
      fileName: 'dataSourceMap.js',
      path: '',
      fileContent: dataSourceMapJS
    },
    {
      fileName: 'dataSource.js',
      path: '',
      fileContent: dataSourceJS
    },
    {
      fileName: 'utils.js',
      path: '',
      fileContent: utilsJS
    },
    {
      fileName: 'bridge.js',
      path: '',
      fileContent: bridgeJS
    },
    {
      fileName: 'locales.js',
      path: '',
      fileContent: localesJS
    },
    {
      fileName: 'stores.js',
      path: '',
      fileContent: storesJS
    },
    {
      fileName: 'storesHelper.js',
      path: '',
      fileContent: storesHelperJS
    }
  ]
}

export default srcFiles
