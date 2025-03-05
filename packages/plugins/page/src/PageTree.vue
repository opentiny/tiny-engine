<template>
  <div class="app-manage-search">
    <tiny-search v-model="state.pageSearchValue" clearable placeholder="搜索">
      <template #prefix>
        <tiny-icon-search />
      </template>
    </tiny-search>
  </div>

  <tiny-collapse v-model="state.collapseValue" class="page-manage-collapse lowcode-scrollbar">
    <tiny-collapse-item v-for="(groupItem, index) in pageSettingState.pages" :key="index" :name="groupItem.groupId">
      <template #title>
        <span class="title">{{ groupItem.groupName }}</span>
      </template>
      <div class="app-manage-tree">
        <draggable-tree
          :data="groupItem.data"
          label-key="name"
          :active="state.currentNodeData.id"
          :filter-value="state.pageSearchValue"
          :root-id="pageSettingState.ROOT_ID"
          :draggable="groupItem.groupId === STATIC_PAGE_GROUP_ID"
          @click-row="handleClickRow"
          @move-node="handleMoveNode"
        >
          <template #row-suffix="{ node }">
            <div :class="['actions']">
              <svg-button v-if="isPageLocked(node.rawData)" name="locked" :hoverBgColor="false"></svg-button>
              <svg-button v-if="node.rawData.isHome" name="home" :hoverBgColor="false"></svg-button>
              <tiny-popover
                :ref="(el) => setPopoverRef(el, node.id)"
                placement="bottom-start"
                :visible-arrow="false"
                popper-class="page-tree-row-operation-list"
              >
                <div class="operation-list">
                  <div
                    v-for="(operation, index) in getRowOperations(groupItem.groupId, node)"
                    :key="index"
                    :class="[operation.type === 'divider' ? 'divider' : 'item'].concat(operation.class || [])"
                    @click="operation.action?.(node)"
                  >
                    {{ operation.label }}
                  </div>
                </div>
                <template #reference>
                  <svg-button name="ellipsis" class="auto-hidden" :hoverBgColor="false"></svg-button>
                </template>
              </tiny-popover>
            </div>
          </template>
        </draggable-tree>
      </div>
    </tiny-collapse-item>
  </tiny-collapse>
</template>

<script lang="jsx">
import { reactive, onMounted, onUnmounted } from 'vue'
import { Search, Collapse, CollapseItem, Popover } from '@opentiny/vue'
import { IconFolderOpened, IconFolderClosed, IconSearch } from '@opentiny/vue-icon'
import {
  useCanvas,
  useModal,
  usePage,
  useNotify,
  useMessage,
  getMetaApi,
  META_SERVICE
} from '@opentiny/tiny-engine-meta-register'
import { isEqual } from '@opentiny/vue-renderless/common/object'
import { getCanvasStatus } from '@opentiny/tiny-engine-common/js/canvas'
import { handlePageUpdate } from '@opentiny/tiny-engine-common/js/http'
import { constants } from '@opentiny/tiny-engine-utils'
import { closePageSettingPanel } from './PageSetting.vue'
import { closeFolderSettingPanel } from './PageFolderSetting.vue'
import http from './http.js'
import DraggableTree from './Tree.vue'
import { SvgButton } from '@opentiny/tiny-engine-common'

const { PAGE_STATUS } = constants

export default {
  components: {
    TinySearch: Search,
    TinyCollapse: Collapse,
    TinyCollapseItem: CollapseItem,
    TinyIconSearch: IconSearch(),
    TinyPopover: Popover,
    DraggableTree,
    SvgButton
  },
  props: {
    isFolder: {
      type: Boolean,
      default: false
    }
  },
  emits: ['openSettingPanel', 'add', 'createPage', 'createFolder'],
  setup(props, { emit }) {
    const { confirm } = useModal()
    const { pageState, isBlock, isSaved } = useCanvas()
    const {
      pageSettingState,
      changeTreeData,
      isCurrentDataSame,
      getPageList,
      resetPageData,
      STATIC_PAGE_GROUP_ID,
      COMMON_PAGE_GROUP_ID,
      switchPage: switchPageById
    } = usePage()
    const { fetchPageDetail, requestUpdatePage } = http
    const getAppId = () => getMetaApi(META_SERVICE.GlobalService).getBaseInfo().id

    const state = reactive({
      pageSearchValue: '',
      collapseValue: [STATIC_PAGE_GROUP_ID, COMMON_PAGE_GROUP_ID],
      currentNodeData: { id: getMetaApi(META_SERVICE.GlobalService).getBaseInfo().pageId }
    })

    const { subscribe, unsubscribe } = useMessage()

    let subscriber = null

    onMounted(() => {
      subscriber = subscribe({
        topic: 'locationHistoryChanged',
        callback: (data) => {
          if (data.pageId) {
            state.currentNodeData = { id: data.pageId }
          } else if (isBlock()) {
            state.currentNodeData = {}
          }
        },
        subscriber: 'pageTree'
      })
    })

    onUnmounted(() => {
      if (subscriber) {
        unsubscribe(subscriber)
      }
    })

    const refreshPageList = async (appId) => {
      const pages = await getPageList(appId)

      return pages
    }

    pageSettingState.updateTreeData = async () => {
      const pageList = await refreshPageList(getAppId())
      return pageList
    }

    const switchPage = (data) => {
      state.currentNodeData = data

      switchPageById(data.id).then(() => {
        closePageSettingPanel()
        closeFolderSettingPanel()
      })
    }

    const nodeClick = (e, pageData) => {
      e?.stopPropagation()

      const { id, isPage } = pageData

      // 区块切换回页面需要重新加载页面
      if ((!isBlock() && id === state?.currentNodeData?.id) || !isPage) {
        return
      }

      if (isSaved() && isCurrentDataSame()) {
        switchPage(pageData)
      } else {
        confirm({
          title: '提示',
          message: `${isBlock() ? '区块' : '页面'}尚未保存，是否要继续切换?`,
          exec: () => {
            changeTreeData(pageSettingState.oldParentId, pageSettingState.currentPageData.parentId)
            Object.assign(pageSettingState.currentPageData, pageSettingState.currentPageDataCopy)
            switchPage(pageData)
          }
        })
      }
    }

    const openSettingPanel = (e, pageData, isPageLocked) => {
      e?.stopPropagation()

      if (isPageLocked && pageData.isPage) {
        const username = pageData.occupier?.username || ''

        useModal().message({
          message: `您点击的页面被${username}锁定，暂时无法编辑，请联系解锁`
        })

        return
      }

      if (isEqual(pageSettingState.currentPageData, pageSettingState.currentPageDataCopy)) {
        emit('openSettingPanel', pageData)
      } else {
        confirm({
          title: '提示',
          message: `当前页面或文件夹${pageSettingState.currentPageData.name}尚未保存，是否要继续切换?`,
          exec: () => {
            changeTreeData(pageSettingState.oldParentId, pageSettingState.currentPageData.parentId)
            Object.assign(pageSettingState.currentPageData, pageSettingState.currentPageDataCopy)
            emit('openSettingPanel', pageData)
          }
        })
      }
    }

    const popoverRefs = {}
    const setPopoverRef = (el, nodeId) => {
      popoverRefs[nodeId] = el
    }

    const handleClickRow = (node) => {
      nodeClick(null, node.rawData)
    }

    const isPageLocked = (pageData) => {
      return getCanvasStatus(pageData.occupier).state === PAGE_STATUS.Lock
    }

    const handleClickPageSettings = (node) => {
      openSettingPanel(null, node.rawData, isPageLocked(node.rawData))
    }

    const createPage = (node) => {
      emit('createPage', 'staticPages', node.id)
    }

    const createFolder = (node) => {
      emit('createFolder', node.id)
    }

    const rowOperations = [
      { type: 'settings', label: '设置', action: handleClickPageSettings },
      { type: 'divider' },
      { type: 'createPage', label: '新建子页面', action: createPage },
      { type: 'createFolder', label: '新建子文件夹', action: createFolder }
      // TODO 复制和删除的逻辑耦合在其他组件内，暂时屏蔽
      // { type: 'divider' },
      // { type: 'copy', label: '复制页面', action: copyPage },
      // { type: 'delete', label: '删除', class: ['danger'], action: deleteNode }
    ].map((item) => ({
      ...item,
      action: (node) => {
        item.action?.(node)
        // 点击 action 后，关闭 popover 弹窗
        popoverRefs[node.id]?.doClose?.()
      }
    }))

    const getRowOperations = (groupId, node) => {
      if (groupId === COMMON_PAGE_GROUP_ID) {
        return rowOperations.slice(0, 1)
      }
      if (!node.rawData.isPage) {
        return rowOperations.filter((item) => item.type !== 'copy')
      }
      return rowOperations
    }

    const updatePage = (pageDetail) => {
      const { id, name, page_content } = pageDetail
      const params = {
        ...pageDetail,
        page_content: {
          ...page_content,
          fileName: name
        }
      }

      const isCurEditPage = pageState?.currentPage?.id === id

      return handlePageUpdate(id, params, false, isCurEditPage)
    }

    const updateFolder = (pageDetail) => {
      const { id } = pageDetail

      // requestUpdatePage加了then和catch回调函数，而handlePageUpdate没有加，是因为handlePageUpdate内部都已经有了类似逻辑
      return requestUpdatePage(id, { ...pageDetail, page_content: null })
        .then(() => {
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
        .finally(() => {
          pageSettingState.updateTreeData()
          pageSettingState.isNew = false
        })
    }

    const handleMoveNode = (dragged, newParent) => {
      if (isEqual(pageSettingState.currentPageData, pageSettingState.currentPageDataCopy)) {
        closePageSettingPanel()
        closeFolderSettingPanel()
        pageSettingState.currentPageData.id = dragged.id
        changeTreeData(newParent.id, dragged.parentId)
        resetPageData()
        // TODO 页面更换父节点后，原来每次变更需要填写变更信息
        fetchPageDetail(dragged.id)
          .then((pageDetail) => {
            pageDetail.parentId = newParent.id
            if (pageDetail.isPage) {
              updatePage(pageDetail)
            } else {
              updateFolder(pageDetail)
            }
          })
          .catch((error) => {
            useNotify({
              type: 'error',
              title: '移动页面文件/文件夹失败',
              message: JSON.stringify(error?.message || error)
            })
          })
      } else {
        confirm({
          title: '提示',
          message: '更改尚未保存，是否要放弃这些更改？',
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

    useMessage().subscribe({
      topic: 'app_id_changed',
      subscriber: 'page_tree_app_id_changed',
      callback: (appId) => {
        refreshPageList(appId)
      }
    })

    const createPublicPage = (e) => {
      e.stopPropagation()
      e.preventDefault()
      emit('add')
    }

    onUnmounted(() => {
      useMessage().unsubscribe({
        topic: 'app_id_changed',
        subscriber: 'page_tree_app_id_changed'
      })
    })

    return {
      createPublicPage,
      state,
      switchPage,
      pageSettingState,
      setPopoverRef,
      IconFolderOpened: IconFolderOpened(),
      IconFolderClosed: IconFolderClosed(),
      getRowOperations,
      handleClickRow,
      handleMoveNode,
      isPageLocked,
      handleClickPageSettings,
      STATIC_PAGE_GROUP_ID
    }
  }
}
</script>

<style lang="less" scoped>
.app-manage-search {
  padding: 0 12px 12px 12px;
}

.page-manage-collapse {
  height: calc(100% - 95px);
  overflow-y: auto;
  .app-manage-public-page {
    position: absolute;
    right: 0;
    cursor: pointer;
    svg {
      font-size: 22px;
    }
  }
  :deep(.tiny-collapse-item__header) {
    &,
    &.is-active {
      &::before {
        border: none;
      }
    }
  }
  :deep(.tiny-collapse-item) {
    border-left: 0;
    border-right: 0;
  }
  :deep(.tiny-collapse-item__content) {
    padding: 0 0 12px 0;
  }
}

.page-manage-collapse.page-manage-collapse {
  :deep(.tiny-collapse-item__content) {
    padding-top: 0;
  }
}

.app-manage-tree {
  .actions {
    display: flex;
    align-items: center;
    svg {
      color: var(--te-page-manage-icon-color);
      outline: none;
    }
    .auto-hidden {
      display: none;
    }
  }
  .row:hover .actions .auto-hidden {
    display: unset;
  }
}
</style>

<style lang="less">
.tiny-popover.tiny-popper[x-placement].page-tree-row-operation-list {
  padding: 0;
  margin-top: 4px;
  .operation-list {
    min-width: 110px;
    padding: 8px 0;
    & > div {
      padding: 0 12px;
    }
    .item {
      height: 24px;
      font-size: 12px;
      line-height: 18px;
      cursor: pointer;
      display: flex;
      align-items: center;
      &:hover {
        background-color: var(--te-page-manage-operation-list-item-bg-color-hover);
      }
    }
    .divider {
      height: 8px;
      display: flex;
      align-items: center;
      &::after {
        content: '';
        display: block;
        width: 100%;
        height: 1px;
        background-color: var(--te-page-manage-operation-list-item-border-color-divider);
      }
    }
    .danger {
      color: var(--te-page-manage-operation-list-text-color-error);
    }
  }
}
</style>
