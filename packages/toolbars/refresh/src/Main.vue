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
    const { beforeRefresh, refreshMethod, afterRefresh } = getOptions(meta.id)

    const refreshResouce = () => {
      // 清空区块缓存(不能清空组件缓存)，保证画布刷新后可以重新注册最新的区块资源
      useMaterial().clearBlockResources()
      // 因为webcomponents无法重复注册，所以需要刷新内部iframe
      useCanvas().canvasApi.value.getDocument().location.reload()

      if (typeof afterRefresh === 'function') {
        try {
          afterRefresh()
        } catch (error) {
          useNotify({
            type: 'error',
            message: `Error in afterRefresh: ${error}`
          })
        }
      }
    }

    const refreshBlock = async () => {
      const block = getCurrentBlock()
      // 第二个参数true表示不激活区块管理面板
      const api = await activePlugin(PLUGIN_NAME.BlockManage, true)
      await api.refreshBlockData(block)
      await initBlock(block, {}, true)
      refreshResouce()
    }

    const refreshPage = async () => {
      if (isEmptyPage()) {
        return
      }

      const { currentPage } = pageState
      const api = await activePlugin(PLUGIN_NAME.AppManage, true)
      const page = await api.getPageById(currentPage.id)
      await initData(page['page_content'], page)
      refreshResouce()
    }

    const refresh = async () => {
      try {
        if (typeof beforeRefresh === 'function') {
          await beforeRefresh()
        }

        if (typeof refreshMethod === 'function') {
          const stop = await refreshMethod()

          if (stop) {
            return
          }
        }
      } catch (error) {
        useNotify({
          type: 'error',
          message: `Error in refreshing: ${error}`
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
