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
import useEditorInfo from '../src/useEditorInfo'
import useResource from '../src/useResource'

export const getCanvasStatus = (data) => {
  // 写死ID 待删除
  let isDemo = useResource().resState.isDemo
  const { resetPasswordToken } = useEditorInfo().userInfo

  if (isDemo && [PAGE_STATUS.Developer, PAGE_STATUS.SuperAdmin].includes(resetPasswordToken)) {
    isDemo = false
  }

  let state = ''

  if (isDemo) {
    state = PAGE_STATUS.Guest
  } else if (!data) {
    state = PAGE_STATUS.Release
  } else {
    state = useEditorInfo().userInfo.id === data.id ? PAGE_STATUS.Occupy : PAGE_STATUS.Lock
  }

  return {
    state,
    data
  }
}
