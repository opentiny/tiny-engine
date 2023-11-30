<template>
  <plugin-setting v-if="isShow" :title="state.title" class="pageFolder-plugin-setting">
    <template #header>
      <button-group>
        <tiny-button type="primary" @click="saveFolderSetting">保存</tiny-button>
        <svg-button
          v-if="!pageSettingState.isNew"
          name="delete"
          placement="bottom"
          tips="删除"
          @click="deleteFolder"
        ></svg-button>
        <svg-button class="close-plugin-setting-icon" name="close" @click="closeFolderSetting"></svg-button>
      </button-group>
    </template>

    <template #content>
      <div class="page-setting-content">
        <tiny-collapse v-model="state.activeName">
          <tiny-collapse-item title="基本设置" name="folderGeneralRef">
            <page-general ref="folderGeneralRef" :isFolder="isFolder"></page-general>
          </tiny-collapse-item>
        </tiny-collapse>
      </div>
    </template>
  </plugin-setting>
</template>

<script>
import { reactive, ref } from 'vue'
import { Button, Collapse, CollapseItem } from '@opentiny/vue'
import { PluginSetting, SvgButton, ButtonGroup } from '@opentiny/tiny-engine-common'
import { usePage, useModal, useApp, useNotify } from '@opentiny/tiny-engine-controller'
import { isEqual } from '@opentiny/vue-renderless/common/object'
import throttle from '@opentiny/vue-renderless/common/deps/throttle'
import PageGeneral from './PageGeneral.vue'
import http from './http.js'

let isShow = ref(false)
export const openFolderSettingPanel = () => {
  isShow.value = true
}

export const closeFolderSettingPanel = () => {
  isShow.value = false

  const { resetPageData } = usePage()

  resetPageData()
}

export default {
  components: {
    TinyButton: Button,
    TinyCollapse: Collapse,
    TinyCollapseItem: CollapseItem,
    PluginSetting,
    PageGeneral,
    SvgButton,
    ButtonGroup
  },
  props: {
    isFolder: {
      type: Boolean,
      default: false
    }
  },
  setup() {
    const state = reactive({
      activeName: ['folderGeneralRef'],
      title: '文件夹设置'
    })
    const folderGeneralRef = ref(null)
    const { requestCreatePage, requestUpdatePage, requestDeletePage } = http
    const { appInfoState } = useApp()
    const { pageSettingState, changeTreeData } = usePage()
    const { confirm } = useModal()

    const closeFolderSetting = () => {
      if (isEqual(pageSettingState.currentPageData, pageSettingState.currentPageDataCopy)) {
        closeFolderSettingPanel()
      } else {
        confirm({
          title: '提示',
          message: '您即将使用未保存的更改关闭此页。是否要在关闭之前放弃这些更改？',
          exec: () => {
            if (!pageSettingState.isNew) {
              changeTreeData(pageSettingState.oldParentId, pageSettingState.currentPageData.parentId)
              Object.assign(pageSettingState.currentPageData, pageSettingState.currentPageDataCopy)
            }
            closeFolderSettingPanel()
          }
        })
      }
    }

    const createFolder = () => {
      const data = pageSettingState.currentPageData
      const createParams = {
        ...data,
        app: appInfoState.selectedId,
        isPage: false
      }

      requestCreatePage(createParams)
        .then(() => {
          pageSettingState.updateTreeData()
          pageSettingState.isNew = false
          closeFolderSettingPanel()
          useNotify({
            type: 'success',
            message: '新建文件夹成功!'
          })
        })
        .catch((error) => {
          useNotify({
            type: 'error',
            title: '新建文件夹失败',
            message: JSON.stringify(error?.message || error)
          })
        })
    }

    const updateFolder = () => {
      const { id } = pageSettingState.currentPageData

      requestUpdatePage(id, { ...pageSettingState.currentPageData, page_content: null })
        .then(() => {
          pageSettingState.updateTreeData()
          pageSettingState.isNew = false
          closeFolderSettingPanel()
          useNotify({
            type: 'success',
            message: '更新文件夹成功!'
          })
        })
        .catch((error) => {
          useNotify({
            type: 'error',
            title: '更新文件夹失败',
            message: JSON.stringify(error?.message || error)
          })
        })
    }

    const saveFolderSetting = () => {
      folderGeneralRef.value.validGeneralForm().then(() => {
        if (pageSettingState.isNew) {
          createFolder()
        } else {
          updateFolder()
        }
      })
    }

    const deleteFolder = () => {
      if (pageSettingState.treeDataMapping[pageSettingState.currentPageData.id]?.children?.length) {
        useNotify({
          type: 'error',
          message: '此文件夹不是空文件夹，不能删除！'
        })

        return
      }

      confirm({
        title: '提示',
        message: '您是否要删除文件夹?',
        exec: () => {
          const id = pageSettingState.currentPageData?.id || ''

          requestDeletePage(id)
            .then(() => {
              pageSettingState.updateTreeData()
              closeFolderSettingPanel()
              useNotify({
                type: 'success',
                message: '删除文件夹成功！'
              })
            })
            .catch((error) => {
              useNotify({
                type: 'success',
                title: '删除文件夹失败！',
                message: JSON.stringify(error?.message || error)
              })
            })
        }
      })
    }

    return {
      saveFolderSetting,
      deleteFolder: throttle(5000, true, deleteFolder),
      folderGeneralRef,
      closeFolderSettingPanel,
      isShow,
      state,
      pageSettingState,
      closeFolderSetting
    }
  }
}
</script>

<style lang="less" scoped>
.pageFolder-plugin-setting {
  :deep(.plugin-setting-header) {
    .close-plugin-setting-icon {
      margin-left: 8px;
    }
  }
}
</style>
