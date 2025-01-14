<template>
  <div class="app-manage-search">
    <tiny-search v-model="state.pageSearchValue" clearable placeholder="搜索" @update:modelValue="searchPageData">
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
        <tiny-tree
          :ref="getPageTreeRefs"
          :key="pageSettingState.pageTreeKey"
          :data="groupItem.data"
          :props="{
            children: 'children',
            label: 'name'
          }"
          default-expand-all
          :filter-node-method="filterPageTreeData"
          :render-content="renderContent"
          :expand-on-click-node="false"
          :icon="nullIcon"
          node-key="id"
        ></tiny-tree>
      </div>
    </tiny-collapse-item>
  </tiny-collapse>
</template>

<script lang="jsx">
import { reactive, ref, nextTick, onUnmounted } from 'vue'
import { Search, Tree, Collapse, CollapseItem } from '@opentiny/vue'
import { IconFolderOpened, IconFolderClosed, IconSearch } from '@opentiny/vue-icon'
import {
  useCanvas,
  useModal,
  usePage,
  useBreadcrumb,
  useLayout,
  useMessage,
  getMetaApi,
  META_SERVICE
} from '@opentiny/tiny-engine-meta-register'
import { isEqual } from '@opentiny/vue-renderless/common/object'
import { getCanvasStatus } from '@opentiny/tiny-engine-common/js/canvas'
import { constants } from '@opentiny/tiny-engine-utils'
import { closePageSettingPanel } from './PageSetting.vue'
import { closeFolderSettingPanel } from './PageFolderSetting.vue'
import http from './http.js'
import { SvgButton } from '@opentiny/tiny-engine-common'

const { ELEMENT_TAG, PAGE_STATUS, COMPONENT_NAME } = constants

export default {
  components: {
    TinySearch: Search,
    TinyTree: Tree,
    TinyCollapse: Collapse,
    TinyCollapseItem: CollapseItem,
    TinyIconSearch: IconSearch()
  },
  props: {
    isFolder: {
      type: Boolean,
      default: false
    }
  },
  emits: ['openSettingPanel', 'add'],
  setup(props, { emit }) {
    const { confirm } = useModal()
    const { initData, pageState, isBlock, isSaved } = useCanvas()
    const { pageSettingState, changeTreeData, isCurrentDataSame, STATIC_PAGE_GROUP_ID, COMMON_PAGE_GROUP_ID } =
      usePage()
    const { fetchPageList, fetchPageDetail } = http
    const { setBreadcrumbPage } = useBreadcrumb()
    const pageTreeRefs = ref([])
    const ROOT_ID = pageSettingState.ROOT_ID
    const getAppId = () => getMetaApi(META_SERVICE.GlobalService).getBaseInfo().id

    const state = reactive({
      pageSearchValue: '',
      collapseValue: [STATIC_PAGE_GROUP_ID, COMMON_PAGE_GROUP_ID],
      currentNodeData: {}
    })
    const formatTreeData = (data, parentId, id) => {
      const originObj = { [ROOT_ID]: { id: ROOT_ID, name: '站点根目录', children: [] } }
      const treeArr = []

      data.forEach((item) => {
        originObj[item[id]] = item
        if (item.parentId === ROOT_ID) {
          originObj[ROOT_ID].children.push(item)
        }
      })

      data.forEach((item) => {
        let parentObj = originObj[item[parentId]]
        if (parentObj && parentObj.id !== ROOT_ID) {
          parentObj.children = parentObj.children || []
          parentObj.children.push(item)
        } else if (parentObj && parentObj.id === ROOT_ID) {
          treeArr.push(item)
        }
      })

      pageSettingState.treeDataMapping = originObj

      return pageSettingState.treeDataMapping
    }

    const searchPageData = (value) => {
      if (Array.isArray(pageTreeRefs?.value)) {
        nextTick(() => {
          pageTreeRefs.value.forEach((item) => {
            item?.filter(value)
          })
        })
      }
    }

    const refreshPageList = async (appId, data) => {
      const pagesData = data ? data : await fetchPageList(appId)

      const firstGroupData = { groupName: '静态页面', groupId: STATIC_PAGE_GROUP_ID, data: [] }
      const secondGroupData = { groupName: '公共页面', groupId: COMMON_PAGE_GROUP_ID, data: [] }

      pagesData.forEach((item) => {
        const namedNode = item.name ? item : { ...item, name: item.folderName, group: 'staticPages' }
        const node = item.meta
          ? {
              ...item,
              ...item.meta,
              name: item.fileName,
              isPage: true,
              isBody: item.meta.rootElement === ELEMENT_TAG.Body
            }
          : namedNode

        const { children, ...other } = node

        if (node.group === 'staticPages') {
          firstGroupData.data.push(other)
        } else {
          secondGroupData.data.push(other)
        }
      })

      const firstGroupTreeData = formatTreeData([...firstGroupData.data], 'parentId', 'id')
      firstGroupData.data = firstGroupTreeData[ROOT_ID].children
      pageSettingState.pages = [firstGroupData, secondGroupData]
      searchPageData(state.pageSearchValue)
      return pageSettingState.pages
    }

    pageSettingState.updateTreeData = async () => {
      const pageList = await refreshPageList(getAppId())
      return pageList
    }

    const clearCurrentState = () => {
      pageState.currentVm = null
      pageState.hoverVm = null
      pageState.properties = {}
      pageState.pageSchema = null
    }

    const updateUrlPageId = (id) => {
      const url = new URL(window.location)

      url.searchParams.delete('blockid')
      url.searchParams.set('pageid', id)
      window.history.pushState({}, '', url)
    }

    const getPageDetail = (pageId) => {
      // pageId !== 0 防止 pageId 为 0 的时候判断不出来
      if (pageId !== 0 && !pageId) {
        updateUrlPageId('')
        initData({ componentName: COMPONENT_NAME.Page }, {})
        useLayout().layoutState.pageStatus = {
          state: 'empty',
          data: {}
        }

        return
      }

      fetchPageDetail(pageId).then((data) => {
        updateUrlPageId(pageId)
        closePageSettingPanel()
        closeFolderSettingPanel()
        useLayout().closePlugin()
        useLayout().layoutState.pageStatus = getCanvasStatus(data.occupier)
        initData(data['page_content'], data)
      })
    }

    const switchPage = (data) => {
      pageState.hoverVm = null
      state.currentNodeData = data

      let pageName = ''
      if (data.isPage) {
        pageName = data?.name || ''
      }
      setBreadcrumbPage([pageName])

      // 切换页面时清空 选中节点信息状态
      clearCurrentState()
      getPageDetail(data.id)
    }

    const nodeClick = (e, node) => {
      e.stopPropagation()

      const { id, isPage } = node.data

      // 区块切换回页面需要重新加载页面
      if ((!isBlock() && id === state?.currentNodeData?.id) || !isPage) {
        return
      }

      if (isSaved() && isCurrentDataSame()) {
        switchPage(node.data)
      } else {
        confirm({
          title: '提示',
          message: `${isBlock() ? '区块' : '页面'}尚未保存，是否要继续切换?`,
          exec: () => {
            changeTreeData(pageSettingState.oldParentId, pageSettingState.currentPageData.parentId)
            Object.assign(pageSettingState.currentPageData, pageSettingState.currentPageDataCopy)
            switchPage(node.data)
          }
        })
      }
    }

    const openSettingPanel = (e, node, isPageLocked) => {
      e.stopPropagation()

      if (isPageLocked && node.data.isPage) {
        const username = node.data.occupier?.username || ''

        useModal().message({
          message: `您点击的页面被${username}锁定，暂时无法编辑，请联系解锁`
        })

        return
      }

      if (isEqual(pageSettingState.currentPageData, pageSettingState.currentPageDataCopy)) {
        emit('openSettingPanel', node)
      } else {
        confirm({
          title: '提示',
          message: `当前页面或文件夹${pageSettingState.currentPageData.name}尚未保存，是否要继续切换?`,
          exec: () => {
            changeTreeData(pageSettingState.oldParentId, pageSettingState.currentPageData.parentId)
            Object.assign(pageSettingState.currentPageData, pageSettingState.currentPageDataCopy)
            emit('openSettingPanel', node)
          }
        })
      }
    }

    const renderContent = (h, { node, data }) => {
      const isPageLocked = getCanvasStatus(data.occupier).state === PAGE_STATUS.Lock

      return (
        <span class="tiny-tree-node__label" onMousedown={(e) => nodeClick(e, node)}>
          {data.isPage ? (
            <SvgIcon name="text-page-common" class="icon-page"></SvgIcon>
          ) : (
            <SvgIcon name="text-page-folder-closed" class="folder-icon"></SvgIcon>
          )}
          <span class="label">{node.label}</span>
          <span class="icons">
            {data.isPage && isPageLocked ? (
              <SvgButton
                class="page-edit-icon"
                name="locked"
                hoverBgColor={false}
                onMousedown={(e) => openSettingPanel(e, node, isPageLocked)}
              ></SvgButton>
            ) : null}
            {data.isHome ? (
              <SvgButton class="page-edit-icon" hoverBgColor={false} name="text-page-home"></SvgButton>
            ) : null}
            <SvgButton
              name="setting"
              class="setting page-edit-icon"
              hoverBgColor={false}
              onMousedown={(e) => openSettingPanel(e, node, isPageLocked)}
            ></SvgButton>
          </span>
        </span>
      )
    }

    useMessage().subscribe({
      topic: 'app_id_changed',
      subscriber: 'page_tree_app_id_changed',
      callback: (appId) => {
        refreshPageList(appId)
      }
    })

    const filterPageTreeData = (value, data) => {
      if (!value) return true

      return data.name?.toLowerCase().indexOf(value?.toLowerCase()) !== -1
    }

    const getPageTreeRefs = (el) => {
      if (el) {
        pageTreeRefs.value.push(el)
      }
    }

    const createPublicPage = (e) => {
      e.stopPropagation()
      e.preventDefault()
      emit('add')
    }

    const nullIcon = <span></span>

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
      searchPageData,
      renderContent,
      refreshPageList,
      filterPageTreeData,
      getPageTreeRefs,
      IconFolderOpened: IconFolderOpened(),
      IconFolderClosed: IconFolderClosed(),
      nullIcon,
      SvgButton
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
  :deep(.tiny-tree.tiny-tree.tiny-tree) {
    .tiny-tree-node__content-left {
      padding: 0;
      .tiny-tree-node__content-box {
        padding: 0 12px;
      }
    }
    .tiny-tree-node__label {
      font-size: 12px;
      display: flex;
      align-items: center;
      flex: 1;

      & .label {
        font-size: 12px;
        flex: 1;
      }
      .icon-page,
      .folder-icon {
        color: var(--te-common-icon-secondary);
        margin-right: 8px;
      }
    }

    .tree-node-icon {
      margin-right: 0;
    }
    .tiny-tree-node.is-leaf .tiny-tree-node__content {
      padding-left: 0;
    }

    .tiny-tree-node.is-current {
      & > .tiny-tree-node__content {
        & > div > .tiny-tree-node__content-box {
          background-color: var(--te-common-bg-container);
        }
      }
    }
  }
}
</style>
