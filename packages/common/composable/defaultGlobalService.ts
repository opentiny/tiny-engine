import {
  useCanvas,
  useResource,
  useMessage,
  defineService,
  getMetaApi,
  META_SERVICE
} from '@opentiny/tiny-engine-meta-register'
import { reactive, watch } from 'vue'

const getBaseInfo = () => {
  const paramsMap = new URLSearchParams(location.search)
  const id = paramsMap.get('id') // appId
  const blockId = paramsMap.get('blockid')
  const pageId = paramsMap.get('pageid')
  const previewId = paramsMap.get('previewid')
  const type = paramsMap.get('type')
  const version = paramsMap.get('version')
  const tenantId = paramsMap.get('tenant')

  return {
    type: type || 'app',
    id,
    pageId,
    previewId,
    blockId,
    version,
    tenantId
  }
}

const initialState = {
  userInfo: null as any,
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
  appList: [] as any[]
}

const userState = reactive({
  userInfo: {
    username: '',
    token: null,
    expireTime: null,
    tenantId: '',
    tenant: []
  },
  needToLogin: false
})

const { subscribe, publish } = useMessage()

const getLoginStatus = () => userState.needToLogin

const setNeedToLogin = (value: boolean) => {
  userState.needToLogin = value

  if (!value) {
    watch(
      useCanvas().isCanvasApiReady,
      (ready) => {
        if (ready) {
          useResource().fetchResource()
        }
      },
      {
        immediate: true
      }
    )
  }
}

const getUserInfo = () => userState.userInfo

const setUserInfo = (data: any) => {
  userState.userInfo = { ...userState.userInfo, ...data }
}

const fetchUserInfo = () => {
  // 获取登录用户信息
  return getMetaApi(META_SERVICE.Http).get('/platform-center/api/user/me', {
    transformRequest: (data: any, headers: any) => {
      delete headers['x-lowcode-org']
      return data
    }
  })
}

const setTenantInfo = (id: any) => {
  // 设置组织
  return getMetaApi(META_SERVICE.Http).get(`/platform-center/api/user/tenant?tenantId=${id}`)
}

// 获取当前应用的信息
const fetchAppInfo = (appId: string) => getMetaApi(META_SERVICE.Http).get(`/app-center/api/apps/detail/${appId}`)

// 获取应用列表
const fetchAppList = (platformId: string) =>
  getMetaApi(META_SERVICE.Http).get(`/app-center/api/apps/list/${platformId}`)

const postLocationHistoryChanged = (data: any) => publish({ topic: 'locationHistoryChanged', data })

/**
 * 过滤掉没有变化的URL参数。pageId和blockId互斥，如果同时存在，会去掉blockId
 * @param {Record<string, any>} params
 * @returns
 */
const filterParams = (params: Record<string, any>) => {
  const fieldsMap = ['pageId', 'blockId', 'previewId'].reduce((result, field) => {
    result[field] = field.toLowerCase()
    return result
  }, {} as Record<string, any>)

  const paramFileds = Object.keys(params)
  const url = new URL(window.location.href)
  const changedParams: any = {}

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
 * @param {boolean} replace
 * @returns
 */
const updateParams = (params: any, replace: boolean = false) => {
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

const updatePageId = (pageId: string) => {
  updateParams({ pageId })
}

const updateBlockId = (blockId: string) => {
  updateParams({ blockId })
}

const updatePreviewId = (previewId: string, replace = false) => {
  updateParams({ previewId }, replace)
}

export default defineService({
  id: META_SERVICE.GlobalService,
  type: 'MetaService',
  options: {
    enableTitleUpdate: true
  },
  initialState,
  init: ({ state, options }) => {
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
      callback: (appId: string) => {
        if (!appId) {
          // eslint-disable-next-line no-console
          console.error('Invalid appId received in app_id_changed event')

          return
        }

        fetchAppInfo(appId).then((app: any) => {
          state.appInfo = app

          if (options.enableTitleUpdate) {
            // 监听应用 ID 变化，根据应用名称设置网页 title
            document.title = `${app.name} —— TinyEngine 前端可视化设计器`
          }
        })
      }
    })

    subscribe({
      topic: 'platform_id_changed',
      callback: (platformId: string) => {
        if (!platformId) {
          // eslint-disable-next-line no-console
          console.error('Received platform_id_changed event with no platformId')

          return
        }
        fetchAppList(platformId).then((list: any[]) => {
          state.appList = list
        })
      }
    })

    fetchUserInfo().then((data: any) => {
      if (data) {
        state.userInfo = data
        userState.userInfo = data
      }
      publish({ topic: 'global_service_init_finish' })
    })
  },
  apis: () => ({
    getLoginStatus,
    setNeedToLogin,
    getUserInfo,
    setUserInfo,
    fetchUserInfo,
    setTenantInfo,
    getBaseInfo,
    postLocationHistoryChanged,
    updateParams,
    updatePageId,
    updateBlockId,
    updatePreviewId
  })
})
