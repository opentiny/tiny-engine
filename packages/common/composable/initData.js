import { useHttp } from '@opentiny/tiny-engine-http'
import { useStore, useModal } from '@opentiny/tiny-engine-meta-register'

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

const getUserInfo = () => {
  const { patchStore } = useStore('globalService')

  // 获取登录用户信息
  useHttp()
    .get('/platform-center/api/user/me')
    .then((data) => {
      if (data) {
        patchStore({ userInfo: data })
      }
    })
    .catch((error) => {
      useModal().message({ message: error.message, status: 'error' })
    })
}

export const initData = async () => {
  const { store, patchStore } = useStore('globalService')

  patchStore({ getBaseInfo })

  await getUserInfo()

  patchStore({ isAdmin: () => store.userInfo.resetPasswordToken === 'p_webcenter' })
}
