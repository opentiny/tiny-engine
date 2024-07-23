import { reactive } from 'vue'
import { useHttp } from '@opentiny/tiny-engine-http'
import { useModal, useMessage } from '@opentiny/tiny-engine-meta-register'

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

const state = reactive({})

const getUserInfo = () => {
  // 获取登录用户信息
  useHttp()
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

export const initData = async () => {
  await getUserInfo()
  useMessage().publish({ topic: 'global_service_init_finish' })
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
