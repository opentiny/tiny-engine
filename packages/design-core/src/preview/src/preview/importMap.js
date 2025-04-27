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
import { getSearchParams } from './http'

const importMap = {}

const opentinyVueVersion = '~3.20'

function replacePlaceholder(v) {
  const { VITE_CDN_TYPE, VITE_CDN_DOMAIN, VITE_LOCAL_CDN_PATH } = useEnv()
  const versionDelimiter = VITE_CDN_TYPE === 'npmmirror' && !VITE_LOCAL_CDN_PATH ? '/' : '@'
  const fileDelimiter = VITE_CDN_TYPE === 'npmmirror' && !VITE_LOCAL_CDN_PATH ? '/files' : ''

  return v
    .replace('${VITE_CDN_DOMAIN}', VITE_LOCAL_CDN_PATH || VITE_CDN_DOMAIN)
    .replace('${opentinyVueVersion}', opentinyVueVersion)
    .replace('${versionDelimiter}', versionDelimiter)
    .replace('${fileDelimiter}', fileDelimiter)
}

export const getImportMap = () => {
  importMap.imports = {
    ...Object.fromEntries(Object.entries(importMapJSON.imports).map(([k, v]) => [k, replacePlaceholder(v)])),
    ...getSearchParams().scripts
  }

  return importMap
}
