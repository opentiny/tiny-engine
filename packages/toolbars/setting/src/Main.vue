<template>
  <toolbar-base
    :content="isBlock() ? '区块设置' : '页面设置'"
    :icon="options.icon.default || options.icon"
    :options="options"
    @click-api="openSetting"
  >
  </toolbar-base>
</template>

<script lang="jsx">
import { useCanvas, useLayout, useBlock, usePage, useModal, useNotify } from '@opentiny/tiny-engine-meta-register'
import { constants } from '@opentiny/tiny-engine-utils'
import { ToolbarBase } from '@opentiny/tiny-engine-common'

const { PAGE_STATUS } = constants
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
          message: `您点击的页面被${username}锁定，暂时无法编辑，请联系解锁`
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
