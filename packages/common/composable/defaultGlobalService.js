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

const updatePageId = (pageId) => {
  const url = new URL(window.location.href)
  url.searchParams.delete('blockid')
  url.searchParams.set('pageid', pageId)
  window.history.pushState({}, '', url)
  postLocationHistoryChanged({ pageId })
}

const updateBlockId = (blockId) => {
  const url = new URL(window.location.href)
  url.searchParams.delete('pageid')
  url.searchParams.set('blockid', blockId)
  window.history.pushState({}, '', url)
  postLocationHistoryChanged({ blockId })
}

const updatePreviewId = (previewId, replace = false) => {
  const url = new URL(window.location.href)
  if (previewId) {
    if (previewId === url.searchParams.get('previewid')) {
      return
    }
    url.searchParams.set('previewid', previewId)
  } else {
    url.searchParams.delete('previewid')
  }
  if (replace) {
    window.history.replaceState({}, '', url)
  } else {
    window.history.pushState({}, '', url)
  }
  postLocationHistoryChanged({ previewId })
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
    updatePageId,
    updateBlockId,
    updatePreviewId
  })
})
