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

// import { hyphenate } from '@vue/shared'

import { getSearchParams } from './http'
import importMapJSON from './importMap.json'
import { VITE_CDN_DOMAIN } from '@opentiny/tiny-engine-controller/js/environments'

const importMap = {}

const opentinyVueVersion = '~3.14'
const versionDelimiter = import.meta.env.VITE_CDN_TYPE === 'npmmirror' ? '/' : '@'
const fileDelimiter = import.meta.env.VITE_CDN_TYPE === 'npmmirror' ? '/files' : ''

function replacePlaceholder(v) {
  return v
    .replace('${VITE_CDN_DOMAIN}', VITE_CDN_DOMAIN)
    .replace('${opentinyVueVersion}', opentinyVueVersion)
    .replace('${versionDelimiter}', versionDelimiter)
    .replace('${fileDelimiter}', fileDelimiter)
}

importMap.imports = {
  ...Object.fromEntries(Object.entries(importMapJSON.imports).map(([k, v]) => [k, replacePlaceholder(v)])),
  ...getSearchParams().scripts
}

export default importMap
