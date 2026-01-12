// origin resource state code too mess up.

import { reactive, ref } from 'vue'
import { fetchResourceList, requestAddReSource, requestUpdateReSource, requestDeleteReSource } from '../http'
import { defineService, getMetaApi, META_SERVICE, useResource } from '@opentiny/tiny-engine-meta-register'
import { RESOURCE_CATEGORY } from './constants'

export interface INpmUtilItem {
  category: 'utils'
  content: {
    destructuring: boolean
    exportName: string
    main: string
    package: string
    version: string
  }
  id: number
  name: string
  type: 'npm'
  app: number
}

export interface IFunctionUtilItem {
  category: 'utils'
  content: {
    type: 'JSFunction'
    value: string
  }
  id: number
  name: string
  type: 'function'
  app: number
}

export type IUtilItem = INpmUtilItem | IFunctionUtilItem

const state = reactive<{
  utils: IUtilItem[]
}>({
  utils: []
})

// 临时用来通知 BridgeManage 刷新列表
const updateCount = ref(0)
const lastOperation = ref<{ id: number | null; type: 'add' | 'update' | 'delete' }>({ id: null, type: 'add' })

const syncUtilsItemToAppSchemaState = (data: IUtilItem) => {
  const index = useResource().appSchemaState[RESOURCE_CATEGORY.Util].findIndex((item) => item.name === data.name)
  const { content, name, type } = data

  if (index === -1) {
    useResource().appSchemaState[RESOURCE_CATEGORY.Util].push({ content, name, type })
    return
  }

  useResource().appSchemaState[RESOURCE_CATEGORY.Util][index] = { content, name, type }
}

const refreshUtils = async () => {
  if (!getMetaApi(META_SERVICE.GlobalService).getBaseInfo().id) {
    return
  }
  const result = (await fetchResourceList(
    getMetaApi(META_SERVICE.GlobalService).getBaseInfo().id,
    RESOURCE_CATEGORY.Util
  )) as IUtilItem[]

  state.utils = result.map(({ category, content, id, name, type, app }) => {
    return {
      category,
      content,
      id,
      name,
      type,
      app
    } as IUtilItem
  })
}

const getUtilById = (id: number) => {
  return state.utils.find((item) => item.id === id)
}

const getUtilByName = (name: string) => {
  return state.utils.find((item) => item.name === name)
}

const addUtils = async (data: Omit<IUtilItem, 'id'>) => {
  const result = await requestAddReSource(data)

  if (!result) {
    return
  }

  lastOperation.value = { id: null, type: 'add' }
  updateCount.value++

  syncUtilsItemToAppSchemaState(result)
  await refreshUtils()

  return result
}

const updateUtils = async (data: IUtilItem) => {
  const result = await requestUpdateReSource(data)

  if (!result) {
    return
  }

  lastOperation.value = { id: result.id, type: 'update' }
  updateCount.value++

  syncUtilsItemToAppSchemaState(result)
  await refreshUtils()

  return result
}

const deleteUtils = async (id: number) => {
  const params = `app=${getMetaApi(META_SERVICE.GlobalService).getBaseInfo().id}&id=${id}`
  const result = await requestDeleteReSource(params)

  if (!result) {
    return
  }

  lastOperation.value = { id, type: 'delete' }
  updateCount.value++

  const utilItem = getUtilById(id)
  const index = useResource().appSchemaState[RESOURCE_CATEGORY.Util].findIndex((item) => item.name === utilItem?.name)

  if (index !== -1) {
    useResource().appSchemaState[RESOURCE_CATEGORY.Util].splice(index, 1)
  }

  await refreshUtils()

  return result
}

const getUtils = () => state.utils
const setUtils = (utils: IUtilItem[]) => {
  state.utils = utils
}

export default defineService({
  id: META_SERVICE.UseUtils,
  type: 'MetaService',
  initialState: {
    utils: []
  },
  options: {},
  init: () => {
    refreshUtils()
  },
  apis: () => ({
    getUtils: () => getUtils(),
    setUtils: (utils: IUtilItem[]) => setUtils(utils),
    addUtils: (data: Omit<IUtilItem, 'id'>) => addUtils(data),
    updateUtils: (data: IUtilItem) => updateUtils(data),
    deleteUtils: (id: number) => deleteUtils(id),
    getUtilById: (id: number) => getUtilById(id),
    refreshUtils: () => refreshUtils(),
    getUtilByName: (name: string) => getUtilByName(name),
    getUpdateCount: () => updateCount.value,
    getLastOperation: () => lastOperation.value
  })
})
