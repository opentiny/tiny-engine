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

import { useHttp } from '@opentiny/tiny-engine-http'
import { atou } from '@opentiny/tiny-engine-controller/js/preview'

const http = useHttp()

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
    ? http.post(
        '/app-center/api/schema2code',
        { platform, app, pageInfo },
        {
          headers: { [HEADER_LOWCODE_ORG]: tenant }
        }
      )
    : http.get('/app-center/api/code', {
        headers: { [HEADER_LOWCODE_ORG]: tenant },
        params: { platform, app, type, id, history }
      })

export const fetchMetaData = async ({ platform, app, type, id, history, tenant } = {}) =>
  id
    ? http.get('/app-center/api/preview/metadata', {
        headers: { [HEADER_LOWCODE_ORG]: tenant },
        params: { platform, app, type, id, history }
      })
    : {}
