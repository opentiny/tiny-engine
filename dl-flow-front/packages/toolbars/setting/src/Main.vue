<template>
  <div class="toolbar-itm-clean">
    <tiny-popover
      trigger="hover"
      :open-delay="1000"
      popper-class="toolbar-right-popover"
      append-to-body
      :content="isBlock() ? '区块设置' : '页面设置'"
    >
      <template #reference>
        <span class="icon" @click="openSetting">
          <svg-icon :name="icon"></svg-icon>
        </span>
      </template>
    </tiny-popover>
  </div>
</template>

<script lang="jsx">
import { Popover } from '@opentiny/vue'
import { useCanvas, useLayout, useBlock, usePage, useModal, useNotify } from '@opentiny/tiny-engine-controller'
import { constants } from '@opentiny/tiny-engine-utils'

const { PAGE_STATUS } = constants
export default {
  components: {
    TinyPopover: Popover
  },
  props: {
    icon: {
      type: String,
      default: 'setting'
    }
  },
  setup() {
    const { pageState, isBlock } = useCanvas()
    const { getCurrentBlock } = useBlock()
    const { initCurrentPageData, isChangePageData } = usePage()
    const { PLUGIN_NAME, activePlugin, layoutState, isEmptyPage } = useLayout()
    const { confirm, message } = useModal()

    const openBlockSetting = () => {
      activePlugin(PLUGIN_NAME.BlockManage).then((api) => {
        api.openSettingPanel({ item: getCurrentBlock() })
      })
    }

    const openPageAndInit = async (api) => {
      const { currentPage } = pageState
      api.openPageSettingPanel()
      const page = await api.getPageById(currentPage.id)
      initCurrentPageData(page)
    }

    const openPageSetting = () => {
      const { pageStatus } = layoutState

      if (pageStatus.state === PAGE_STATUS.Lock) {
        const username = pageStatus.data?.username || ''
        message({
          message: `您点击的页面被${username}锁定，暂时无法编辑，请联系解锁`,
          status: 'info'
        })
        return
      }

      activePlugin(PLUGIN_NAME.AppManage).then((api) => {
        if (isChangePageData()) {
          confirm({
            title: '提示',
            message: `当前页面尚未保存，是否要继续切换?`,
            exec: () => {
              openPageAndInit(api)
            }
          })
          return
        }
        openPageAndInit(api)
      })
    }

    const openSetting = () => {
      if (isEmptyPage()) {
        useNotify({ type: 'warning', message: '请先创建页面' })

        return
      }

      if (isBlock()) {
        openBlockSetting()
        return
      }

      openPageSetting()
    }

    return {
      openSetting,
      isBlock
    }
  }
}
</script>
