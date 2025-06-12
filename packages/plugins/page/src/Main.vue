<template>
  <div class="plugin-page">
    <plugin-panel
      :title="title"
      :fixed-name="PLUGIN_NAME.AppManage"
      :fixedPanels="fixedPanels"
      @close="pluginPanelClosed"
      :docsUrl="docsUrl"
      :docsContent="docsContent"
      :isShowDocsIcon="true"
    >
      <template #header>
        <svg-button
          class="add-folder-icon"
          name="add-folder"
          placement="bottom"
          tips="新建文件夹"
          @click="createNewFolder()"
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
          @createPage="createNewPage"
          @createFolder="createNewFolder"
          @settingHome="settingHome"
        ></page-tree>
      </template>
    </plugin-panel>
    <page-setting :isFolder="state.isFolder" @openNewPage="openNewPage"></page-setting>
    <page-folder-setting :isFolder="state.isFolder"></page-folder-setting>
  </div>
</template>

<script lang="tsx">
/* metaService: engine.plugins.appmanage.Main */
import { reactive, ref, watchEffect, provide } from 'vue'
import { useCanvas, usePage, useHelp, useModal, useNotify, useLayout } from '@opentiny/tiny-engine-meta-register'
import { PluginPanel, SvgButton } from '@opentiny/tiny-engine-common'
import { extend } from '@opentiny/vue-renderless/common/object'
import PageSetting, { openPageSettingPanel, closePageSettingPanel } from './PageSetting.vue'
import PageFolderSetting, { openFolderSettingPanel, closeFolderSettingPanel } from './PageFolderSetting.vue'
import PageTree from './PageTree.vue'
import { fetchPageDetail, handleRouteHomeUpdate } from './http'

export const api = {
  getPageById: async (id) => {
    if (id) {
      return fetchPageDetail(id)
    }

    return undefined
  },
  openPageSettingPanel
}

/* metaComponent: engine.plugins.page */
export default {
  components: {
    PageSetting,
    PluginPanel,
    SvgButton,
    PageFolderSetting,
    PageTree
  },
  props: {
    title: {
      type: String,
      default: '页面'
    },
    fixedPanels: {
      type: Array
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    const { confirm } = useModal()
    const { pageState } = useCanvas()
    const { pageSettingState, getDefaultPage, isTemporaryPage, initCurrentPageData } = usePage()

    const { PLUGIN_NAME } = useLayout()

    const panelState = reactive({
      emitEvent: emit
    })

    provide('panelState', panelState)

    const pageTreeRef = ref(null)
    const ROOT_ID = pageSettingState.ROOT_ID
    const docsUrl = useHelp().getDocsUrl('page')
    const docsContent = '在这里新增页面/文件夹，还可以对已有的页面进行生命周期管理。'

    const state = reactive({
      isFolder: false
    })

    const createNewPage = (group, parentId = ROOT_ID) => {
      closeFolderSettingPanel()
      pageSettingState.isNew = true
      try {
        const defaultPage = getDefaultPage()
        if (!defaultPage) {
          throw new Error('Failed to get default page configuration')
        }
        pageSettingState.currentPageData = {
          ...getDefaultPage(),
          ...defaultPage,
          parentId,
          route: '',
          name: 'Untitled',
          page_content: {
            lifeCycles: {}
          },
          group
        }
      } catch (error) {
        throw new Error(error)
        // console.error('Failed to create new page:', error)
      }
      pageSettingState.currentPageDataCopy = extend(true, {}, pageSettingState.currentPageData)
      state.isFolder = false
      openPageSettingPanel()
    }

    const createNewFolder = (parentId = ROOT_ID) => {
      closePageSettingPanel()
      pageSettingState.isNew = true
      pageSettingState.currentPageData = { parentId, route: '', name: 'untitled' }
      pageSettingState.currentPageDataCopy = extend(true, {}, pageSettingState.currentPageData)
      state.isFolder = true
      openFolderSettingPanel()
    }

    const settingHome = (node) => {
      confirm({
        title: '提示',
        type: 'warning ',
        message: '是否确定要将此页面设置为主页？',
        exec: () => {
          const params = { ...node.rawData, isHome: true }

          handleRouteHomeUpdate(node.id, params)
            .then(() => {
              pageSettingState.updateTreeData()
              pageSettingState.isNew = false
              useNotify({ message: '主页设置成功！', type: 'success' })
            })
            .catch(() => {
              useNotify({ message: '主页设置失败！', type: 'error' })
            })
        }
      })
    }

    watchEffect(() => {
      if (isTemporaryPage.saved) {
        openPageSettingPanel()
      }
    })

    const openSettingPanel = async (pageData) => {
      state.isFolder = !pageData.isPage
      pageSettingState.isNew = false

      const isPageChange = pageData.id !== pageSettingState.currentPageData.id

      if (state.isFolder) {
        if (isPageChange) {
          closePageSettingPanel()
        }
        openFolderSettingPanel()
      } else {
        if (isPageChange) {
          closeFolderSettingPanel()
        }
        openPageSettingPanel()
      }
      const pageDetail = await fetchPageDetail(pageData?.id)
      initCurrentPageData(pageDetail)
    }

    provide('openSettingPanel', openSettingPanel)

    const pluginPanelClosed = () => {
      emit('close')
      closePageSettingPanel()
      closeFolderSettingPanel()
    }

    const openNewPage = (data) => {
      pageTreeRef.value.switchPage(data)
    }

    return {
      PLUGIN_NAME,
      state,
      pageState,
      openNewPage,
      pageTreeRef,
      pluginPanelClosed,
      openSettingPanel,
      createNewFolder,
      createNewPage,
      docsUrl,
      docsContent,
      settingHome
    }
  }
}
</script>

<style lang="less" scoped>
:deep(.tiny-button) {
  border-radius: 4px;
  height: 24px;
  line-height: 24px;
}
.plugin-page {
  height: 100%;
}
</style>
