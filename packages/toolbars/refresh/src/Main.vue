<template>
  <toolbar-base content="刷新画布" :icon="options.icon.default || options.icon" :options="options" @click-api="refresh">
  </toolbar-base>
</template>

<script>
import {
  useMaterial,
  useCanvas,
  useModal,
  useLayout,
  useBlock,
  useNotify,
  useMessage,
  getOptions
} from '@opentiny/tiny-engine-meta-register'
import { ToolbarBase } from '@opentiny/tiny-engine-common'
import meta from '../meta'

export default {
  components: {
    ToolbarBase
  },
  props: {
    options: {
      type: Object,
      default: () => ({})
    }
  },
  setup() {
    const { confirm } = useModal()
    const { isBlock, isSaved, pageState, initData } = useCanvas()
    const { PLUGIN_NAME, activePlugin, isEmptyPage } = useLayout()
    const { getCurrentBlock, initBlock } = useBlock()
    const { beforeRefresh } = getOptions(meta.id)
    const { publish } = useMessage()

    const refreshResource = () => {
      // 清空区块缓存(不能清空组件缓存)，保证画布刷新后可以重新注册最新的区块资源
      useMaterial().clearBlockResources()
      // 因为webcomponents无法重复注册，所以需要刷新内部iframe
      useCanvas().canvasApi.value.getDocument().location.reload()
      // 通知画布更新完成
      publish({ topic: 'canvas_refreshed' })
    }

    const refreshBlock = async () => {
      const block = getCurrentBlock()
      // 第二个参数true表示不激活区块管理面板
      const api = await activePlugin(PLUGIN_NAME.BlockManage, true)
      await api.refreshBlockData(block)
      await initBlock(block, {}, true)
      refreshResource()
    }

    const refreshPage = async () => {
      if (isEmptyPage()) {
        return
      }

      const { currentPage } = pageState
      const api = await activePlugin(PLUGIN_NAME.AppManage, true)
      const page = await api.getPageById(currentPage.id)
      await initData(page['page_content'], page)
      refreshResource()
    }

    const refresh = async () => {
      try {
        if (typeof beforeRefresh === 'function') {
          const stop = await beforeRefresh()

          if (stop) {
            return
          }
        }
      } catch (error) {
        useNotify({
          type: 'error',
          message: `Error in beforeRefresh: ${error}`
        })
      }

      if (isSaved()) {
        isBlock() ? refreshBlock() : refreshPage()
      } else {
        confirm({
          title: '提示',
          message: `${isBlock() ? '区块' : '页面'}尚未保存，是否要继续刷新?`,
          exec: () => {
            isBlock() ? refreshBlock() : refreshPage()
          }
        })
      }
    }

    return {
      refresh
    }
  }
}
</script>
