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

import { reactive } from 'vue'
import { useApp, useResource, useNotify, useCanvas } from '@opentiny/tiny-engine-controller'
import { isVsCodeEnv } from '@opentiny/tiny-engine-controller/js/environments'
import {
  fetchResourceList,
  requestDeleteReSource,
  requestAddReSource,
  requestUpdateReSource,
  requestGenerateBridgeUtil
} from '../http'

const state = reactive({
  actionType: '',
  type: '',
  category: '',
  resource: {},
  resources: [],
  resourceNames: {},
  refresh: false,
  id: useApp().appInfoState.selectedId
})

const DEFAULT_RESOURCE = {
  name: '',
  type: 'npm',
  content: {
    package: '',
    version: '',
    exportName: '',
    subName: '',
    destructuring: true,
    main: ''
  }
}

const DEFAULT_RESOURCE_FUNTION = {
  name: '',
  type: 'function',
  content: {
    type: 'JSFunction',
    value: ''
  }
}

const TempBridge = [
  {
    name: 'clone',
    type: 'npm',
    category: 'utils',
    content: {
      package: 'lodash',
      version: '4.17.21',
      exportName: 'clone',
      subName: '',
      destructuring: false,
      main: '/lib/clone'
    }
  },
  {
    name: 'moment',
    type: 'npm',
    category: 'utils',
    content: {
      package: '@alifd/next',
      version: '0.0.1',
      exportName: 'Moment',
      subName: '',
      destructuring: true,
      main: ''
    }
  },
  {
    name: 'lowcode',
    type: 'npm',
    category: 'utils',
    content: {
      package: '@/lowcode',
      version: '0.0.1',
      exportName: 'lowcode',
      subName: '',
      destructuring: true,
      main: ''
    }
  }
]

export const RESOURCE_TYPE = {
  Util: 'utils',
  Bridge: 'bridge'
}

export const RESOURCE_CATEGORY = {
  Npm: 'npm',
  Function: 'function'
}

export const RESOURCE_TIP = {
  [RESOURCE_TYPE.Util]: '新建工具类',
  [RESOURCE_TYPE.Bridge]: '新建桥接源'
}

export const ACTION_TYPE = {
  Read: 'read',
  Edit: 'edit'
}

export const getResources = () => {
  const id = useApp().appInfoState.selectedId
  state.resources.length ||
    fetchResourceList(id).then((data) => {
      state.resources = data || TempBridge
    })
}

export const getResourceNamesByType = (type) => state.resourceNames[type]

export const setResourceNamesByType = (type, names) => {
  state.resourceNames[type] = names
}

export const getResourcesByType = (type) => {
  const id = useApp().appInfoState.selectedId
  return fetchResourceList(id, type)
}

export const getActionType = () => state.actionType

export const setActionType = (type) => {
  state.actionType = type
}

export const getResource = () => state.resource

export const setResource = (resource = DEFAULT_RESOURCE) => {
  if (!resource) {
    resource = state.category === RESOURCE_CATEGORY.Function ? DEFAULT_RESOURCE_FUNTION : DEFAULT_RESOURCE
  }
  state.resource = resource
}

export const getType = () => state.type

export const setType = (type) => {
  state.type = type
}

export const setCategory = (category) => {
  state.category = category
}

export const setStatus = () => {
  state.refresh = true
}

export const getCategory = () => state.category

// VS Code环境生成本地util
const generateBridgeUtil = (...args) => {
  if (isVsCodeEnv) {
    requestGenerateBridgeUtil(...args)
  }
}

export const saveResource = (data, callback, emit) => {
  const { updateUtils } = useCanvas().canvasApi.value

  if (getActionType() === ACTION_TYPE.Edit) {
    data.id = state.resource.id
    requestUpdateReSource(data).then((result) => {
      if (result) {
        const index = useResource().resState[data.category].findIndex((item) => item.name === result.name)
        useResource().resState[data.category][index] = result

        // 更新画布工具函数环境，保证渲染最新工具类返回值, 并触发画布的强制刷新
        updateUtils([result])
        generateBridgeUtil(useApp().appInfoState.selectedId)

        useNotify({
          type: 'success',
          message: '修改成功'
        })

        emit('refresh', state.type)
        state.refresh = true
        callback()
      }
    })
  } else {
    requestAddReSource(data).then((result) => {
      if (result) {
        useResource().resState[data.category].push(result)

        // 更新画布工具函数环境，保证渲染最新工具类返回值, 并触发画布的强制刷新
        updateUtils([result])
        generateBridgeUtil(useApp().appInfoState.selectedId)
        useNotify({
          type: 'success',
          message: '创建成功'
        })
        emit('refresh', state.type)
        state.refresh = true
        callback()
      }
    })
  }
}

export const deleteData = (name, callback, emit) => {
  const params = `app=${useApp().appInfoState.selectedId}&id=${state.resource?.id}`
  const { deleteUtils } = useCanvas().canvasApi.value

  requestDeleteReSource(params).then((data) => {
    if (data) {
      const index = useResource().resState[state.type].findIndex((item) => item.name === data.name)
      useResource().resState[state.type].splice(index, 1)

      deleteUtils([data])
      generateBridgeUtil(useApp().appInfoState.selectedId)
      useNotify({
        type: 'success',
        message: '删除成功'
      })
      emit('refresh', state.type)
      state.refresh = true
      callback()
    }
  })
}
