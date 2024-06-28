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

import { reactive, watch } from 'vue'
import { useHttp } from '@opentiny/tiny-engine-http'

const defaultState = {
  // 应用列表
  list: [],
  // 当前选中的应用
  selectedApp: {
    id: '',
    name: '',
    app_desc: '',
    app_website: '',
    obs_url: null,
    published_at: '',
    created_at: '',
    updated_at: '',
    platform: '',
    state: null,
    published: false,
    tenant: null,
    editor_url: ''
  },
  // 当前选中的appId
  selectedId: ''
}

const appInfoState = reactive({ ...defaultState })

// 获取当前应用的信息
const fetchAppInfo = (appId) => useHttp().get(`/app-center/api/apps/detail/${appId}`)

watch(
  () => appInfoState.selectedId,
  (id) => {
    fetchAppInfo(id).then((app) => {
      appInfoState.selectedApp = app
      // 监听应用 ID 变化，根据应用名称设置网页 title
      document.title = `${app.name} —— TinyEditor 前端可视化设计器`
    })
  }
)

// 获取应用列表
const fetchAppList = (platformId) => useHttp().get(`/app-center/api/apps/list/${platformId}`)

const updateApp = async (id) => {
  const appInfo = await fetchAppInfo(id)
  appInfoState.selectedApp = appInfo
  appInfoState.selectedId = appInfo.id
}

export default () => {
  return {
    appInfoState,
    fetchAppInfo,
    fetchAppList,
    updateApp
  }
}
