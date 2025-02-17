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

import { atou } from '@opentiny/tiny-engine-common/js/preview'
import { getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'

const HEADER_LOWCODE_ORG = 'x-lowcode-org'

export const getSearchParams = () => {
  let params

  try {
    params = JSON.parse(atou(location.hash.slice(1)))
  } catch (error) {
    params = {}
  }

  return params
}

export const fetchCode = async ({ platform, app, type, id, history, pageInfo, tenant } = {}) =>
  pageInfo
    ? getMetaApi(META_SERVICE.Http).post(
        '/app-center/api/schema2code',
        { platform, app, pageInfo },
        {
          headers: { [HEADER_LOWCODE_ORG]: tenant }
        }
      )
    : getMetaApi(META_SERVICE.Http).get('/app-center/api/code', {
        headers: { [HEADER_LOWCODE_ORG]: tenant },
        params: { platform, app, type, id, history }
      })

export const fetchMetaData = async ({ platform, app, type, id, history, tenant } = {}) =>
  id
    ? getMetaApi(META_SERVICE.Http).get('/app-center/api/preview/metadata', {
        headers: { [HEADER_LOWCODE_ORG]: tenant },
        params: { platform, app, type, id, history }
      })
    : {}

export const fetchImportMap = async () => {
  const baseUrl = new URL(import.meta.env.BASE_URL, location.href)
  return fetch(new URL('./preview-import-map-static/preview-importmap.json', baseUrl).href).then((res) => res.json())
}

export const fetchAppSchema = async (id) => getMetaApi(META_SERVICE.Http).get(`/app-center/v1/api/apps/schema/${id}`)
export const fetchBlockSchema = async (blockName) =>
  getMetaApi(META_SERVICE.Http).get(`/material-center/api/block?label=${blockName}`)
export const fetchIcons = async () => getMetaApi(META_SERVICE.Http).post(`/app-center/api/icons/list`)
