import { useHttp } from '@opentiny/tiny-engine-http'
import { useMessage, useModal } from '@opentiny/tiny-engine-meta-register'
import { reactive } from 'vue'

const getBaseInfo = () => {
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

const state = reactive({
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
})

const getUserInfo = async () => {
  // 获取登录用户信息
  await useHttp()
    .get('/platform-center/api/user/me')
    .then((data) => {
      if (data) {
        state.userInfo = data
      }
    })
    .catch((error) => {
      useModal().message({ message: error.message, status: 'error' })
    })
}

// 获取当前应用的信息
const fetchAppInfo = (appId) => useHttp().get(`/app-center/api/apps/detail/${appId}`)

// 获取应用列表
const fetchAppList = (platformId) => useHttp().get(`/app-center/api/apps/list/${platformId}`)

const { subscribe, publish } = useMessage()

subscribe({
  topic: 'app_id_changed',
  callback: (appId) => {
    fetchAppInfo(appId).then((app) => {
      state.appInfo = app
      // 监听应用 ID 变化，根据应用名称设置网页 title
      document.title = `${app.name} —— TinyEditor 前端可视化设计器`

      publish({ topic: 'app_info_changed' })
    })
  }
})

subscribe({
  topic: 'platform_id_changed',
  callback: (platformId) => {
    fetchAppList(platformId).then((list) => {
      state.appList = list

      publish({ topic: 'app_list_changed' })
    })
  }
})

const initData = async () => {
  await getUserInfo()
  publish({ topic: 'global_service_init_finish' })
}

export default {
  id: 'engine.service.globalService',
  type: 'MetaService',
  options: {},
  state,
  apis: {
    getBaseInfo,
    isAdmin: () => state.userInfo.resetPasswordToken === 'p_webcenter'
  },
  init: initData
}
