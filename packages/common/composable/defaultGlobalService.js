import { useMessage, useModal, defineService, getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'
import { watch } from 'vue'

const getBaseInfo = () => {
  const paramsMap = new URLSearchParams(location.search)
  const id = paramsMap.get('id')
  const blockId = paramsMap.get('blockid')
  const pageId = paramsMap.get('pageid')
  const previewId = paramsMap.get('previewid')
  const type = paramsMap.get('type')
  const version = paramsMap.get('version')

  return {
    type: type || 'app',
    id,
    pageId,
    previewId,
    blockId,
    version
  }
}

const initialState = {
  userInfo: null,
  // 当前应用
  appInfo: {
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
  // 应用列表
  appList: []
}

const getUserInfo = () => {
  // 获取登录用户信息
  return getMetaApi(META_SERVICE.Http)
    .get('/platform-center/api/user/me')
    .catch((error) => {
      useModal().message({ message: error.message, status: 'error' })
    })
}

// 获取当前应用的信息
const fetchAppInfo = (appId) => getMetaApi(META_SERVICE.Http).get(`/app-center/api/apps/detail/${appId}`)

// 获取应用列表
const fetchAppList = (platformId) => getMetaApi(META_SERVICE.Http).get(`/app-center/api/apps/list/${platformId}`)

const { subscribe, publish } = useMessage()

const postLocationHistoryChanged = (data) => publish({ topic: 'locationHistoryChanged', data })

/**
 * 过滤掉没有变化的URL参数。pageId和blockId互斥，如果同时存在，会去掉blockId
 * @param {Record<string, any>} params
 * @returns
 */
const filterParams = (params) => {
  const fieldsMap = ['pageId', 'blockId', 'previewId'].reduce((result, field) => {
    result[field] = field.toLowerCase()
    return result
  }, {})

  const paramFileds = Object.keys(params)
  const url = new URL(window.location.href)
  const changedParams = {}

  Object.entries(fieldsMap).forEach(([field, urlParamKey]) => {
    if (paramFileds.includes(field) && params[field] !== url.searchParams.get(urlParamKey)) {
      changedParams[field] = params[field]
    }
  })

  const changedParamFields = Object.keys(changedParams)
  // pageId和blockId互斥，如果同时存在，会去掉blockId
  if (changedParamFields.includes('pageId') && changedParamFields.includes('blockId')) {
    delete changedParams.blockId
  }

  return changedParams
}

/**
 * 支持pageId, blockId, previewId 批量更新，pageId和blockId互斥，如果同时存在，会去掉blockId
 * @param {*} params
 * @param {*} replace
 * @returns
 */
const updateParams = (params, replace = false) => {
  const changedParams = filterParams(params)
  const url = new URL(window.location.href)

  const { pageId, blockId, previewId } = changedParams
  const changedParamFields = Object.keys(changedParams)

  if (changedParamFields.length === 0) {
    return
  }

  // pageId 与 blockId 互斥
  if (changedParamFields.includes('pageId')) {
    url.searchParams.delete('blockid')
    url.searchParams.set('pageid', pageId)
  } else if (changedParamFields.includes('blockId')) {
    url.searchParams.delete('pageid')
    url.searchParams.set('blockid', blockId)
  }

  if (changedParamFields.includes('previewId')) {
    if (previewId) {
      url.searchParams.set('previewid', previewId)
    } else {
      url.searchParams.delete('previewid')
    }
  }

  if (replace) {
    window.history.replaceState({}, '', url)
  } else {
    window.history.pushState({}, '', url)
  }

  postLocationHistoryChanged(changedParams)
}

const updatePageId = (pageId) => {
  updateParams({ pageId })
}

const updateBlockId = (blockId) => {
  updateParams({ blockId })
}

const updatePreviewId = (previewId, replace = false) => {
  updateParams({ previewId }, replace)
}

export default defineService({
  id: META_SERVICE.GlobalService,
  type: 'MetaService',
  options: {},
  initialState,
  init: ({ state }) => {
    watch(
      () => state.appInfo,
      (appInfo) => {
        publish({ topic: 'app_info_changed', data: appInfo })
      }
    )

    watch(
      () => state.appList,
      (appList) => {
        publish({ topic: 'app_list_changed', data: appList })
      }
    )

    subscribe({
      topic: 'app_id_changed',
      callback: (appId) => {
        if (!appId) {
          // eslint-disable-next-line no-console
          console.error('Invalid appId received in app_id_changed event')

          return
        }

        fetchAppInfo(appId).then((app) => {
          state.appInfo = app
          // 监听应用 ID 变化，根据应用名称设置网页 title
          document.title = `${app.name} —— TinyEditor 前端可视化设计器`
        })
      }
    })

    subscribe({
      topic: 'platform_id_changed',
      callback: (platformId) => {
        if (!platformId) {
          // eslint-disable-next-line no-console
          console.error('Received platform_id_changed event with no platformId')

          return
        }
        fetchAppList(platformId).then((list) => {
          state.appList = list
        })
      }
    })

    getUserInfo().then((data) => {
      if (data) {
        state.userInfo = data
      }
      publish({ topic: 'global_service_init_finish' })
    })
  },
  apis: ({ state }) => ({
    getBaseInfo,
    isAdmin: () => state.userInfo.resetPasswordToken === 'p_webcenter',
    postLocationHistoryChanged,
    updateParams,
    updatePageId,
    updateBlockId,
    updatePreviewId
  })
})
