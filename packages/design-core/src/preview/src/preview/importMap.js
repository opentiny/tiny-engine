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

import { useEnv } from '@opentiny/tiny-engine-meta-register'
import { importMapConfig as importMapJSON } from '@opentiny/tiny-engine-common/js/importMap'

const importMap = {}

const opentinyVueVersion = '~3.20'

function replacePlaceholder(v) {
  const {
    VITE_CDN_TYPE,
    VITE_CDN_DOMAIN,
    VITE_LOCAL_IMPORT_PATH = 'local-cdn-static',
    BASE_URL,
    VITE_LOCAL_IMPORT_MAPS
  } = useEnv()
  const isLocalBundle = VITE_LOCAL_IMPORT_MAPS === 'true'
  const versionDelimiter = VITE_CDN_TYPE === 'npmmirror' && !isLocalBundle ? '/' : '@'
  const fileDelimiter = VITE_CDN_TYPE === 'npmmirror' && !isLocalBundle ? '/files' : ''
  const cdnDomain = isLocalBundle ? BASE_URL + VITE_LOCAL_IMPORT_PATH : VITE_CDN_DOMAIN

  return v
    .replace('${VITE_CDN_DOMAIN}', cdnDomain)
    .replace('${opentinyVueVersion}', opentinyVueVersion)
    .replace('${versionDelimiter}', versionDelimiter)
    .replace('${fileDelimiter}', fileDelimiter)
}

export const getImportMap = (scripts = {}) => {
  importMap.imports = {
    ...Object.fromEntries(Object.entries(importMapJSON.imports).map(([k, v]) => [k, replacePlaceholder(v)])),
    ...scripts
  }

  return importMap
}
