<template>
  <tiny-popover
    trigger="hover"
    :open-delay="1000"
    popper-class="toolbar-right-popover"
    append-to-body
    content="刷新画布"
  >
    <template #reference>
      <span class="icon" @click="refresh">
        <svg-icon :name="icon"></svg-icon>
      </span>
    </template>
  </tiny-popover>
</template>

<script>
import { Popover } from '@opentiny/vue'
import { useResource, useCanvas, useModal, useLayout, useBlock } from '@opentiny/tiny-engine-controller'

export default {
  components: {
    TinyPopover: Popover
  },
  props: {
    icon: {
      type: String,
      default: 'refresh'
    }
  },
  setup() {
    const { confirm } = useModal()
    const { isBlock, isSaved, pageState, initData } = useCanvas()
    const { PLUGIN_NAME, activePlugin, isEmptyPage } = useLayout()
    const { getCurrentBlock, initBlock } = useBlock()

    const refreshResouce = () => {
      // 清空区块缓存(不能清空组件缓存)，保证画布刷新后可以重新注册最新的区块资源
      useResource().clearBlockResources()
      // 因为webcomponents无法重复注册，所以需要刷新内部iframe
      useCanvas().canvasApi.value.getDocument().location.reload()
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

    const refresh = () => {
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
