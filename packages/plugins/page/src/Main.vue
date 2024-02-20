<template>
  <plugin-panel :title="title" @close="pluginPanelClosed">
    <template #header>
      <link-button :href="docsUrl"></link-button>
      <svg-button
        class="add-folder-icon"
        name="add-folder"
        placement="bottom"
        tips="新建文件夹"
        @click="createNewFolder"
      ></svg-button>
      <svg-button
        class="new-page-icon"
        name="new-page"
        placement="bottom"
        tips="新建页面"
        @click="createNewPage('staticPages')"
      ></svg-button>
    </template>

    <template #content>
      <page-tree
        ref="pageTreeRef"
        :isFolder="state.isFolder"
        @add="createNewPage('publicPages')"
        @openSettingPanel="openSettingPanel"
      ></page-tree>
    </template>
  </plugin-panel>

  <page-setting :isFolder="state.isFolder" @openNewPage="openNewPage"></page-setting>

  <page-folder-setting :isFolder="state.isFolder"></page-folder-setting>
</template>

<script lang="jsx">
import { reactive, ref, watchEffect, provide } from 'vue'
import { useCanvas, useApp, useResource, usePage, useHelp } from '@opentiny/tiny-engine-controller'
import { PluginPanel, SvgButton, LinkButton } from '@opentiny/tiny-engine-common'
import { extend } from '@opentiny/vue-renderless/common/object'
import PageSetting, { openPageSettingPanel, closePageSettingPanel } from './PageSetting.vue'
import PageFolderSetting, { openFolderSettingPanel, closeFolderSettingPanel } from './PageFolderSetting.vue'
import PageTree from './PageTree.vue'
import { fetchPageDetail } from './http'

export const api = {
  getPageById: async (id) => {
    if (id) {
      return fetchPageDetail(id)
    }

    return undefined
  },
  openPageSettingPanel
}

export default {
  components: {
    PageSetting,
    PluginPanel,
    SvgButton,
    PageFolderSetting,
    PageTree,
    LinkButton
  },
  props: {
    title: {
      type: String,
      default: '页面管理'
    }
  },
  setup() {
    const { appInfoState } = useApp()
    const { pageState } = useCanvas()
    const { pageSettingState, DEFAULT_PAGE, isTemporaryPage, initCurrentPageData } = usePage()
    const { resState } = useResource()
    const pageTreeRef = ref(null)
    const ROOT_ID = pageSettingState.ROOT_ID
    const docsUrl = useHelp().getDocsUrl('page')

    const state = reactive({
      isFolder: false
    })

    const createNewPage = (group) => {
      closeFolderSettingPanel()
      pageSettingState.isNew = true
      pageSettingState.currentPageData = {
        ...DEFAULT_PAGE,
        parentId: ROOT_ID,
        route: '',
        name: 'Untitled',
        page_content: {
          lifeCycles: {}
        },
        group
      }
      pageSettingState.currentPageDataCopy = extend(true, {}, pageSettingState.currentPageData)
      state.isFolder = false
      openPageSettingPanel()
    }

    const createNewFolder = () => {
      closePageSettingPanel()
      pageSettingState.isNew = true
      pageSettingState.currentPageData = { parentId: ROOT_ID, route: '', name: 'untitled' }
      pageSettingState.currentPageDataCopy = extend(true, {}, pageSettingState.currentPageData)
      state.isFolder = true
      openFolderSettingPanel()
    }

    watchEffect(() => {
      if (isTemporaryPage.saved) {
        openPageSettingPanel()
      }
    })

    const openSettingPanel = async (node) => {
      state.isFolder = !node.data.isPage
      pageSettingState.isNew = false

      const isPageChange = node.data.id !== pageSettingState.currentPageData.id

      if (state.isFolder) {
        isPageChange && closePageSettingPanel()
        openFolderSettingPanel()
      } else {
        isPageChange && closeFolderSettingPanel()
        openPageSettingPanel()
      }
      const pageDetail = await fetchPageDetail(node.data?.id)
      initCurrentPageData(pageDetail)
    }

    provide('openSettingPanel', openSettingPanel)

    const pluginPanelClosed = () => {
      closePageSettingPanel()
      closeFolderSettingPanel()
    }

    const openNewPage = (data) => {
      pageTreeRef.value.switchPage(data)
    }

    return {
      state,
      resState,
      appInfoState,
      pageState,
      openNewPage,
      pageTreeRef,
      pluginPanelClosed,
      openSettingPanel,
      createNewFolder,
      createNewPage,
      docsUrl
    }
  }
}
</script>

<style lang="less" scoped>
:deep(.help-box) {
  position: absolute;
  left: 72px;
  top: 3px;
}
</style>
