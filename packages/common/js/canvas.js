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

import { PAGE_STATUS } from './constants'
import { useResource, getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'

export const getCanvasStatus = (data) => {
  const globalState = getMetaApi(META_SERVICE.GlobalService).getState()
  const isDemo = useResource().appSchemaState.isDemo
  let state = ''

  if (isDemo) {
    state = PAGE_STATUS.Guest
  } else if (!data) {
    state = PAGE_STATUS.Release
  } else {
    state = globalState.userInfo.id === data.id ? PAGE_STATUS.Occupy : PAGE_STATUS.Lock
  }

  return {
    state,
    data
  }
}
