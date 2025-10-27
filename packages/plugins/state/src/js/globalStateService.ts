import { computed } from 'vue'
import { defineService, getMetaApi, META_SERVICE, useResource } from '@opentiny/tiny-engine-meta-register'
import { updateGlobalState as updateGlobalStateHttp } from './http'

interface IGlobalState {
  id: string
  state: Record<string, any>
  getters: Record<string, any>
  actions: Record<string, any>
}

const globalState = computed(() => useResource().appSchemaState.globalState || [])

const getGlobalState = () => globalState.value

// 删除全局应用状态
const deleteGlobalState = async (id: string) => {
  const storeList = useResource().appSchemaState.globalState || []
  const index = storeList.findIndex((store) => store.id === id)

  if (index === -1) {
    return
  }

  const newStoreList = storeList.filter((store) => store.id !== id)
  const { id: appId } = getMetaApi(META_SERVICE.GlobalService).getBaseInfo()
  const res = await updateGlobalStateHttp(appId, { global_state: newStoreList })

  let updatedStoreList = newStoreList
  if (Array.isArray(res.global_state)) {
    updatedStoreList = res.global_state
  }

  useResource().appSchemaState.globalState = updatedStoreList

  return res
}

// 更新全局应用状态
const updateGlobalState = async (data: IGlobalState) => {
  const { id } = data
  const storeList = useResource().appSchemaState.globalState || []
  const index = storeList.findIndex((store) => store.id === id)

  if (index === -1) {
    throw new Error(`globalState ${id} not found 全局应用状态 ${id} 不存在`)
  }

  const newStoreList = storeList.map((store) => (store.id === id ? data : store))
  const { id: appId } = getMetaApi(META_SERVICE.GlobalService).getBaseInfo()
  const res = await updateGlobalStateHttp(appId, { global_state: newStoreList })
  let updatedStoreList = newStoreList

  if (Array.isArray(res.global_state)) {
    updatedStoreList = res.global_state
  }

  useResource().appSchemaState.globalState = updatedStoreList

  return res
}

// 新增全局应用状态
const addGlobalState = async (data: IGlobalState) => {
  const storeList = useResource().appSchemaState.globalState || []
  const id = data.id

  if (storeList.find((store) => store.id === id)) {
    throw new Error('globalState id conflict 全局应用状态名冲突')
  }

  const newStoreList = [...storeList, data]
  const { id: appId } = getMetaApi(META_SERVICE.GlobalService).getBaseInfo()
  const res = await updateGlobalStateHttp(appId, { global_state: newStoreList })

  let updatedStoreList = newStoreList

  if (Array.isArray(res.global_state)) {
    updatedStoreList = res.global_state
  }

  useResource().appSchemaState.globalState = updatedStoreList

  return res
}

const getGlobalStateById = (id: string) => {
  const storeList = useResource().appSchemaState.globalState || []
  return storeList.find((store) => store.id === id)
}

export default defineService({
  id: META_SERVICE.GlobalStateService,
  type: 'MetaService',
  initialState: {},
  options: {},
  init: () => {},
  apis: () => ({
    getGlobalState: () => getGlobalState(),
    deleteGlobalState: (id: string) => deleteGlobalState(id),
    updateGlobalState: (data: IGlobalState) => updateGlobalState(data),
    addGlobalState: (data: IGlobalState) => addGlobalState(data),
    getGlobalStateById: (id: string) => getGlobalStateById(id)
  })
})
