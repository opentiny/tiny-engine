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

import { reactive, ref } from 'vue'
import {
  useBlock,
  useCanvas,
  useLayout,
  useNotify,
  usePage,
  getOptions,
  getMetaApi,
  META_APP
} from '@opentiny/tiny-engine-meta-register'
import { constants } from '@opentiny/tiny-engine-utils'
import { handlePageUpdate } from '@opentiny/tiny-engine-common/js/http'
import meta from '../../meta'

const { PAGE_STATUS } = constants
const state = reactive({
  visible: false,
  code: '',
  originalCode: '',
  disabled: false
})

export const isLoading = ref(false)

// 保存或新建区块
const saveBlock = async (pageSchema) => {
  const api = getMetaApi(META_APP.BlockManage)
  const { getCurrentBlock } = useBlock()
  const block = getCurrentBlock()

  block.label = pageSchema.fileName
  // 画布上的schem回写到block的schema
  block.content = pageSchema
  // 获取区块截图
  isLoading.value = true
  block.screenshot = await api.getBlockBase64()
  await api.saveBlock?.(block)
  isLoading.value = false
}

const savePage = async (pageSchema) => {
  const { currentPage } = useCanvas().pageState
  const params = {
    page_content: pageSchema
  }

  isLoading.value = true
  await handlePageUpdate(currentPage.id, { ...currentPage, ...params }, false, true)
  isLoading.value = false
}

export const saveCommon = (value) => {
  const { pageSettingState, isTemporaryPage } = usePage()
  const { isBlock, canvasApi, pageState } = useCanvas()
  const pageSchema = JSON.parse(value)
  const { setSchema, selectNode } = canvasApi.value

  pageState.pageSchema = pageSchema
  // setSchema 是异步，保存直接传递当前 schema
  setSchema(pageSchema)

  if (pageSettingState?.isAIPage) {
    if (isTemporaryPage.saved) {
      isTemporaryPage.saved = false
    }

    // 如果当前页面没有ID，为临时生成的页面，则打开新建页面面板
    isTemporaryPage.saved = true
    const pageContent = 'page_content'

    pageSettingState.currentPageData[pageContent] = pageSchema

    return Promise.resolve()
  }

  // 选中画布中的页面，关闭插件、属性配置
  selectNode(null)

  return isBlock() ? saveBlock(pageSchema) : savePage(pageSchema)
}
export const openCommon = async () => {
  const { isSaved, canvasApi } = useCanvas()
  if (isSaved() || state.disabled) {
    return
  }

  const { beforeSave, saveMethod, saved } = getOptions(meta.id)

  try {
    if (typeof beforeSave === 'function') {
      await beforeSave()
    }

    if (typeof saveMethod === 'function') {
      const stop = await saveMethod()

      if (stop) {
        return
      }
    }
  } catch (error) {
    useNotify({
      type: 'error',
      message: `Error in saving: ${error}`
    })
  }

  const pageStatus = useLayout().layoutState?.pageStatus
  const curPageState = pageStatus?.state
  const pageInfo = pageStatus?.data
  const { getSchema } = canvasApi.value
  const ERR_MSG = {
    [PAGE_STATUS.Release]: '当前页面未锁定，请先锁定再保存',
    [PAGE_STATUS.Empty]: '当前应用无页面，请先新建页面再保存',
    [PAGE_STATUS.Guest]: '官网演示应用不能保存页面，如需体验请切换应用',
    [PAGE_STATUS.Lock]: `当前页面被 ${pageInfo?.username} ${pageInfo?.resetPasswordToken} 锁定，如需编辑请先联系他解锁文件，然后再锁定该页面后编辑！`
  }

  if ([PAGE_STATUS.Release, PAGE_STATUS.Empty, PAGE_STATUS.Guest, PAGE_STATUS.Lock].includes(curPageState)) {
    useNotify({
      type: 'error',
      title: '保存失败',
      message: ERR_MSG[curPageState]
    })

    return
  }

  state.disabled = true

  const pageSchema = getSchema()

  state.code = JSON.stringify(pageSchema || {}, null, 2)

  // 获取请求前schema代码，暂时先屏蔽
  /**
  if (useCanvas().isBlock()) {
          const api = getMetaApi(META_APP.BlockManage)
          const block = useBlock().getCurrentBlock()
          const remote = await api.getBlockById(block?.id)
          state.originalCode = JSON.stringify(remote?.content || {}, null, 2)
        } else {
          const api = getMetaApi(META_APP.AppManage)
          const remote = await api.getPageById(pageState?.currentPage?.id)
          state.originalCode = JSON.stringify(remote?.['page_content'] || {}, null, 2)
        }
   */

  saveCommon(state.code).finally(() => {
    state.disabled = false

    if (typeof saved === 'function') {
      try {
        saved()
      } catch (error) {
        useNotify({
          type: 'error',
          message: `Error in saved: ${error}`
        })
      }
    }
  })
}
