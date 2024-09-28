<template>
  <plugin-setting v-if="isShow" :title="state.title" class="page-plugin-setting">
    <template #header>
      <button-group>
        <tiny-button type="primary" @click="savePageSetting">保存</tiny-button>
        <svg-button v-if="!pageSettingState.isNew" name="delete" tips="删除页面" @click="deletePage"></svg-button>
        <svg-button
          v-if="!pageSettingState.isNew"
          name="text-copy-page"
          placement="bottom"
          tips="复制页面"
          @click="copyPage"
        ></svg-button>
      </button-group>
      <svg-button class="close-plugin-setting-icon" name="close" @click="cancelPageSetting"></svg-button>
    </template>

    <template #content>
      <div class="page-setting-content">
        <tiny-collapse v-model="state.activeName" class="page-setting-collapse">
          <tiny-collapse-item title="基本设置" :name="PAGE_SETTING_SESSION.general">
            <page-general ref="pageGeneralRef" :isFolder="isFolder"></page-general>
          </tiny-collapse-item>

          <tiny-collapse-item
            class="base-setting"
            v-if="pageSettingState.currentPageData.group !== 'public'"
            title="输入输出"
            :name="PAGE_SETTING_SESSION.inputOutput"
          >
            <page-input-output></page-input-output>
          </tiny-collapse-item>
          <tiny-collapse-item
            class="input-output"
            v-if="pageSettingState.currentPageData.group !== 'public'"
            title="页面生命周期配置"
            :name="PAGE_SETTING_SESSION.lifeCycles"
          >
            <life-cycles
              :bindLifeCycles="pageSettingState.currentPageData.page_content?.lifeCycles"
              @updatePageLifeCycles="updatePageLifeCycles"
            ></life-cycles>
          </tiny-collapse-item>

          <tiny-collapse-item class="history-source" title="历史备份" :name="PAGE_SETTING_SESSION.history">
            <page-history @restorePage="restorePage"></page-history>
          </tiny-collapse-item>
        </tiny-collapse>
      </div>
    </template>
  </plugin-setting>
</template>

<script lang="jsx">
import { reactive, ref } from 'vue'
import { Button, Collapse, CollapseItem, Input } from '@opentiny/vue'
import { PluginSetting, ButtonGroup, SvgButton, LifeCycles } from '@opentiny/tiny-engine-common'
import { useLayout, usePage, useCanvas, useModal, useApp, useNotify } from '@opentiny/tiny-engine-controller'
import { extend, isEqual } from '@opentiny/vue-renderless/common/object'
import { constants } from '@opentiny/tiny-engine-utils'
import { isVsCodeEnv } from '@opentiny/tiny-engine-controller/js/environments'
import { handlePageUpdate } from '@opentiny/tiny-engine-controller/js/http'
import { generatePage } from '@opentiny/tiny-engine-controller/js/vscodeGenerateFile'
import PageGeneral from './PageGeneral.vue'
import PageHistory from './PageHistory.vue'
import PageInputOutput from './PageInputOutput.vue'
import http from './http.js'

const { COMPONENT_NAME } = constants
const isShow = ref(false)

export const openPageSettingPanel = () => {
  isShow.value = true
}

export const closePageSettingPanel = () => {
  isShow.value = false

  const { resetPageData } = usePage()

  resetPageData()
}

const PAGE_SETTING_SESSION = {
  general: 'general',
  inputOutput: 'inputOutput',
  lifeCycles: 'lifeCycles',
  history: 'history'
}

export default {
  components: {
    TinyButton: Button,
    TinyCollapse: Collapse,
    TinyCollapseItem: CollapseItem,
    PageInputOutput,
    LifeCycles,
    PageGeneral,
    PageHistory,
    PluginSetting,
    SvgButton,
    ButtonGroup
  },
  props: {
    isFolder: {
      type: Boolean,
      default: false
    }
  },
  emits: ['openNewPage'],
  setup(props, { emit }) {
    const { requestCreatePage, requestDeletePage } = http
    const { appInfoState } = useApp()
    const {
      DEFAULT_PAGE,
      pageSettingState,
      changeTreeData,
      isCurrentDataSame,
      initCurrentPageData,
      isTemporaryPage,
      STATIC_PAGE_GROUP_ID
    } = usePage()
    const { pageState, initData } = useCanvas()
    const { confirm } = useModal()
    const pageGeneralRef = ref(null)

    const state = reactive({
      activeName: Object.values(PAGE_SETTING_SESSION),
      title: '页面设置',
      historyMessage: ''
    })

    const cancelPageSetting = () => {
      if (isEqual(pageSettingState.currentPageData, pageSettingState.currentPageDataCopy)) {
        closePageSettingPanel()
      } else {
        confirm({
          title: '提示',
          message: '您即将使用未保存的更改关闭此页。是否要在关闭之前放弃这些更改？',
          exec: () => {
            if (!pageSettingState.isNew) {
              changeTreeData(pageSettingState.oldParentId, pageSettingState.currentPageData.parentId)
              Object.assign(pageSettingState.currentPageData, pageSettingState.currentPageDataCopy)
            }
            closePageSettingPanel()
          }
        })
      }
    }

    const createPage = () => {
      const { page_content, ...other } = DEFAULT_PAGE
      const { page_content: page_content_state, ...pageSettingStateOther } = pageSettingState.currentPageData
      const createParams = {
        ...other,
        ...pageSettingStateOther,
        page_content: {
          ...page_content,
          ...page_content_state,
          fileName: pageSettingState.currentPageData.name
        },
        app: appInfoState.selectedId,
        isPage: true
      }

      if (createParams.id) {
        delete createParams.id
        delete createParams._id
      }

      requestCreatePage(createParams)
        .then((data) => {
          pageSettingState.updateTreeData()
          pageSettingState.isNew = false
          isTemporaryPage.saved = false
          emit('openNewPage', data)
          closePageSettingPanel()
          useLayout().closePlugin()
          useNotify({
            type: 'success',
            message: '新建页面成功!'
          })
          if (isVsCodeEnv) {
            generatePage(data)
          }
        })
        .catch((err) => {
          useNotify({
            type: 'error',
            title: '新建页面失败',
            message: JSON.stringify(err?.message || err)
          })
        })
    }

    const updatePage = (id, params) => {
      const routerChange = pageSettingState.currentPageDataCopy.route !== pageSettingState.currentPageData.route
      const isCurEditPage = pageState?.currentPage?.id === id

      return handlePageUpdate(id, params, routerChange, isCurEditPage)
    }

    const restorePage = (pageData) => {
      pageData.id = pageData.page

      const unnecessaryFields = ['page', 'backupTime', 'backupTitle', 'time']
      unnecessaryFields.forEach((key) => delete pageData[key])

      const params = {
        ...pageSettingState.currentPageData,
        ...pageData,
        message: '还原页面'
      }

      updatePage(pageData.id, params).then((data) => {
        // 还原的页面是当前页，需要同步更新画布
        if (pageState?.currentPage?.id === data?.id) {
          initData(data.page_content, data)
        }
      })
    }

    const editPage = async () => {
      // 更新页面
      const { id, name, page_content } = pageSettingState.currentPageData
      const params = {
        ...pageSettingState.currentPageData,
        page_content: {
          ...page_content,
          fileName: name
        }
      }

      const res = await updatePage(id, params)

      initCurrentPageData(res)
    }

    const updatePageLifeCycles = (val) => {
      if (!val) {
        return
      }

      const pageContent = pageSettingState.currentPageData.page_content

      pageContent.lifeCycles = {
        ...(pageContent.lifeCycles || {}),
        ...val
      }
    }

    const copyPageData = () => {
      const data = pageSettingState.currentPageData
      const copyData = extend(true, {}, data)

      pageSettingState.isNew = true
      copyData.name = `${copyData.name}Copy`
      copyData.route = `${copyData.route}Copy`
      pageSettingState.currentPageData = copyData
      pageSettingState.currentPageDataCopy = extend(true, {}, copyData)
    }

    const copyPage = () => {
      if (!isCurrentDataSame()) {
        confirm({
          title: '提示',
          message: '您即将复制的页面有更改未保存，是否确定跳过更改直接复制？',
          exec: () => {
            changeTreeData(pageSettingState.oldParentId, pageSettingState.currentPageData.parentId)
            Object.assign(pageSettingState.currentPageData, pageSettingState.currentPageDataCopy)
            copyPageData()
          }
        })
      } else {
        copyPageData()
      }
    }

    const createHistoryMessage = () => {
      const title = '创建历史备份信息'
      const status = 'custom'
      const messageRender = {
        render: () => <Input placeholder="历史备份信息" v-model={state.historyMessage}></Input>
      }
      const exec = () => {
        pageSettingState.currentPageData.message = state.historyMessage.trim() || 'Page auto save'

        if (pageSettingState.isNew) {
          createPage()
        } else {
          editPage()
        }

        state.historyMessage = ''
      }

      confirm({ title, status, message: messageRender, exec })
    }

    const savePageSetting = () => {
      pageGeneralRef.value.validGeneralForm().then(createHistoryMessage)
    }

    const collectAllPage = (staticPageList = []) => {
      if (!Array.isArray(staticPageList)) {
        return []
      }

      const pageList = []

      staticPageList.forEach((pageItem) => {
        if (pageItem?.isPage) {
          pageList.push(pageItem)

          return
        }

        if (!pageItem?.isPage && pageItem?.children?.length) {
          pageList.push(...collectAllPage(pageItem.children))
        }
      })

      return pageList
    }

    const deletePage = () => {
      confirm({
        title: '提示',
        message: '您是否要删除页面?',
        exec: () => {
          const id = pageSettingState.currentPageData?.id || ''
          requestDeletePage(id)
            .then(() => {
              pageSettingState.updateTreeData().then((pages) => {
                if (pageState?.currentPage?.id !== id) {
                  return
                }

                const staticPageList = (pages || []).find(({ groupId }) => groupId === STATIC_PAGE_GROUP_ID)?.data || []
                const pageList = collectAllPage(staticPageList)

                const pageHome = pageList.find((page) => page.isHome)
                const firstPage = pageList?.[0]
                const defaultPage = {
                  componentName: COMPONENT_NAME.Page
                }

                emit('openNewPage', pageHome || firstPage || defaultPage)
              })

              closePageSettingPanel()
              useNotify({ message: '删除页面成功！', type: 'success' })
            })
            .catch(() => {
              useNotify({ message: '删除页面失败！', type: 'error' })
            })
        }
      })
    }

    return {
      state,
      isShow,
      savePageSetting,
      copyPage,
      pageSettingState,
      pageGeneralRef,
      deletePage,
      cancelPageSetting,
      closePageSettingPanel,
      updatePageLifeCycles,
      restorePage,
      PAGE_SETTING_SESSION
    }
  }
}
</script>

<style lang="less" scoped>
.tiny-search {
  padding: 10px;
  border-top: 1px solid var(--ti-lowcode-page-manage-tip-border-color);
  border-bottom: 1px solid var(--ti-lowcode-page-manage-tip-border-color);
}

.block-add-content {
  display: flex;
  flex-direction: column;
  height: calc(100% - 45px);
}

.page-plugin-setting {
  :deep(.plugin-setting-header) {
    .close-plugin-setting-icon {
      margin-left: 16px;
    }
  }

  :deep(.plugin-setting-content) {
    padding: 16px 0;
  }
}

.page-setting-collapse {
  :deep(.tiny-collapse-item__header) {
    &,
    &.is-active {
      &::before {
        border: none;
      }
    }

    .svg-icon {
      margin-right: 6px;
    }
  }
  .base-setting {
    margin-top: -22px;
  }
  .input-output {
    margin-top: -28px;
  }
  .history-source {
    margin-top: 7px;
  }
}
</style>
