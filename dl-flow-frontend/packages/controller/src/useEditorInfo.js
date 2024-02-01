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
import useModal from './useModal'

// web版获取配置信息: 从url中获取
const _getWebData = () => {
  const paramsMap = new URLSearchParams(location.search)
  const id = paramsMap.get('id')
  const blockId = paramsMap.get('blockid')
  const pageId = paramsMap.get('pageid')
  const type = paramsMap.get('type')
  const version = paramsMap.get('version')

  return {
    type: type || 'app',
    id,
    pageId,
    blockId,
    version
  }
}

let userInfo = {}
const getUserInfo = () => {
  // 获取登录用户信息
  useHttp()
    .get('/platform-center/api/user/me')
    .then((data) => {
      if (data) {
        userInfo = data
      }
    })
    .catch((error) => {
      useModal().message({ message: error.message, status: 'error' })
    })
}

const isAdmin = () => userInfo.resetPasswordToken === 'p_webcenter'
/**
 * 1、是否是VSCode插件: 通过是否有全局变量window.vscodeBridge判断
 *
 * 2、vscode中类型和id
 *   window.vscodeInjectData
 *      type: app 应用管理  block 区块管理
 *      id: 应用id/blockid
 *      ...其他详细信息
 *
 * 3、web版中，通过url参数判断
 *      type: app 应用管理  block 区块管理
 *      id: 应用id/blockid
 *
 */
export default () => {
  return {
    useInfo: _getWebData,
    getUserInfo,
    userInfo,
    isAdmin
  }
}
