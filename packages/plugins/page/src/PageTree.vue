<template>
  <div class="app-manage-search">
    <tiny-search
      v-model="state.pageSearchValue"
      clearable
      placeholder="搜索页面"
      @update:modelValue="searchPageData"
    ></tiny-search>
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
          :shrink-icon="shrinkIcon"
          :expand-icon="expandIcon"
          node-key="id"
        ></tiny-tree>
      </div>
    </tiny-collapse-item>
  </tiny-collapse>
</template>

<script lang="jsx">
import { reactive, ref, watchEffect, nextTick } from 'vue'
import { Search, Tree, Collapse, CollapseItem } from '@opentiny/vue'
import { IconFolderOpened, IconFolderClosed } from '@opentiny/vue-icon'
import { useCanvas, useApp, useModal, usePage, useBreadcrumb, useLayout } from '@opentiny/tiny-engine-controller'
import { isEqual } from '@opentiny/vue-renderless/common/object'
import { getCanvasStatus } from '@opentiny/tiny-engine-controller/js/canvas'
import { constants } from '@opentiny/tiny-engine-utils'
import { closePageSettingPanel } from './PageSetting.vue'
import { closeFolderSettingPanel } from './PageFolderSetting.vue'
import http from './http.js'

const { ELEMENT_TAG, PAGE_STATUS, COMPONENT_NAME } = constants

export default {
  components: {
    TinySearch: Search,
    TinyTree: Tree,
    TinyCollapse: Collapse,
    TinyCollapseItem: CollapseItem
  },
  props: {
    isFolder: {
      type: Boolean,
      default: false
    }
  },
  emits: ['openSettingPanel', 'add'],
  setup(props, { emit }) {
    const { appInfoState } = useApp()
    const { confirm } = useModal()
    const { initData, pageState, isBlock, isSaved } = useCanvas()
    const { pageSettingState, changeTreeData, isCurrentDataSame, STATIC_PAGE_GROUP_ID, COMMON_PAGE_GROUP_ID } =
      usePage()
    const { fetchPageList, fetchPageDetail } = http
    const { setBreadcrumbPage } = useBreadcrumb()
    const pageTreeRefs = ref([])
    const ROOT_ID = pageSettingState.ROOT_ID

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
      const pageList = await refreshPageList(appInfoState.selectedId)
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
          message: `您点击的页面被${username}锁定，暂时无法编辑，请联系解锁`,
          status: 'info'
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
      if (!data.isPage && !data.children) {
        data.trueFolder = true
      } else {
        data.trueFolder = false
      }

      const isPageLocked = getCanvasStatus(data.occupier).state === PAGE_STATUS.Lock
      const pageEditIcon = isPageLocked ? (
        <SvgIcon
          class="page-edit-icon"
          name="locked-outline"
          onMousedown={(e) => openSettingPanel(e, node, isPageLocked)}
        ></SvgIcon>
      ) : null

      return (
        <span class="tiny-tree-node__label" onMousedown={(e) => nodeClick(e, node)}>
          <span class="page-name-label" title={node.label}>
            {data.isPage ? <SvgIcon name="text-page-common" class="icon-page"></SvgIcon> : null}
            {data.trueFolder ? <SvgIcon name="text-page-folder-closed" class="folder-icon"></SvgIcon> : null}
            <span class="label">{node.label}</span>
          </span>
          <span class="icons">
            {data.isPage ? pageEditIcon : null}
            {data.isHome ? (
              <span class="home">
                <SvgIcon class="page-edit-icon" name="text-page-home"></SvgIcon>
              </span>
            ) : null}
            <SvgIcon
              name="setting"
              class="setting  page-edit-icon"
              onMousedown={(e) => openSettingPanel(e, node, isPageLocked)}
            ></SvgIcon>
          </span>
        </span>
      )
    }

    watchEffect(() => {
      if (appInfoState.selectedId) {
        refreshPageList(appInfoState.selectedId)
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

    const expandIcon = <SvgIcon name="text-page-folder-closed" class="folder-icon"></SvgIcon>

    const shrinkIcon = <SvgIcon name="text-page-folder" class="folder-icon"></SvgIcon>

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
      shrinkIcon,
      expandIcon
    }
  }
}
</script>

<style lang="less" scoped>
.app-manage-search {
  padding: 8px 10px;
  border-bottom: 1px solid var(--ti-lowcode-page-manage-search-border-color);
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
    .title {
      margin-left: 6px;
    }
  }
}

.app-manage-tree {
  :deep(.label) {
    margin-right: 10px;
    margin-left: 20px;
  }
  :deep(.tiny-tree) {
    background: var(--ti-lowcode-page-manage-tree-node-background-color);
    color: var(--ti-lowcode-page-manage-tree-color);

    .tiny-tree-node {
      &:hover {
        background-color: var(--ti-lowcode-page-manage-page-tree-background-hover-color);
      }
      &.is-current,
      &.is-current .tiny-tree-node__content,
      &.is-current .tiny-tree-node__content-box {
        color: var(--ti-lowcode-page-manage-tree-color);
        background-color: var(--ti-lowcode-page-manage-page-tree-background-active-color);
        &:hover {
          background-color: var(--ti-lowcode-page-manage-page-tree-background-hover-color);
        }
        & > .tiny-tree-node__content-left {
          font-weight: 700;
        }
      }
    }
    .tiny-tree-node__label {
      width: 100%;
      display: flex;
      justify-content: space-between;
      height: 30px;
      line-height: 30px;
      .page-edit-icon {
        font-size: 16px;
      }
    }
    .tiny-tree-node__content {
      height: 32px;
      &::before {
        content: '';
        width: 12px;
        height: 100%;
        // 页面拖拽功能没上，先不显示拖拽图标
        // background-image: url(data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSLlm77lsYJfMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgeD0iMHB4IiB5PSIwcHgiIHZpZXdCb3g9IjAgMCAxNiAxNiIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgMTYgMTY7IiB4bWw6c3BhY2U9InByZXNlcnZlIiB3aWR0aD0iMTMycHgiIGhlaWdodD0iMTMycHgiPgo8c3R5bGUgdHlwZT0idGV4dC9jc3MiPgoJLnN0MHtmaWxsOiNhZGIwYjg7fQo8L3N0eWxlPgo8cGF0aCBpZD0iaWNvbi3np7vliqgiIGNsYXNzPSJzdDAiIGQ9Ik0xMCwzQzkuNCwzLDksMi42LDksMnMwLjQtMSwxLTFjMC42LDAsMSwwLjQsMSwxUzEwLjYsMywxMCwzeiBNNiwzQzUuNCwzLDUsMi42LDUsMiYjMTA7JiM5O3MwLjQtMSwxLTFzMSwwLjQsMSwxUzYuNiwzLDYsM3ogTTEwLDdDOS40LDcsOSw2LjYsOSw2czAuNC0xLDEtMWMwLjYsMCwxLDAuNCwxLDFTMTAuNiw3LDEwLDd6IE02LDdDNS40LDcsNSw2LjYsNSw2czAuNC0xLDEtMSYjMTA7JiM5O3MxLDAuNCwxLDFTNi42LDcsNiw3eiBNMTAsMTFjLTAuNiwwLTEtMC40LTEtMWMwLTAuNiwwLjQtMSwxLTFjMC42LDAsMSwwLjQsMSwxQzExLDEwLjYsMTAuNiwxMSwxMCwxMXogTTYsMTFjLTAuNiwwLTEtMC40LTEtMSYjMTA7JiM5O2MwLTAuNiwwLjQtMSwxLTFzMSwwLjQsMSwxQzcsMTAuNiw2LjYsMTEsNiwxMXogTTEwLDE1Yy0wLjYsMC0xLTAuNC0xLTFzMC40LTEsMS0xYzAuNiwwLDEsMC40LDEsMVMxMC42LDE1LDEwLDE1eiBNNiwxNSYjMTA7JiM5O2MtMC42LDAtMS0wLjQtMS0xczAuNC0xLDEtMXMxLDAuNCwxLDFTNi42LDE1LDYsMTV6Ii8+Cjwvc3ZnPg==);
        background-size: 12px 32px;
        background-repeat: no-repeat;
        background-position: 3px 3px;
        cursor: ns-resize;
        opacity: 0.35;
        visibility: hidden;
      }
      &:hover {
        border-radius: 0;
        .icons {
          .setting {
            display: inline-block;
            font-size: 16px;
          }
        }

        &::before {
          visibility: visible;
        }
      }
      .folder-icon {
        color: var(--ti-lowcode-page-manage-content-tips-color);
      }
    }

    .page-name-label {
      display: flex;
      align-items: center;
      .icon-page {
        margin-right: -15px;
      }
      .label {
        display: inline-block;
        max-width: 160px;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .icons {
      display: flex;
      align-items: center;
      padding-right: 12px;
      font-size: 16px;

      .page-status {
        display: block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: green;
      }

      .page-status.locked {
        background: red;
      }

      .home {
        margin-left: 5px;
      }

      .setting {
        display: none;
        margin-left: 6px;
      }

      svg {
        color: var(--ti-lowcode-page-manage-content-tips-color);
        &:hover {
          color: var(--ti-lowcode-page-manage-svg-hover-color);
        }
      }
    }

    .tiny-tree-node__expand-icon:not(.is-leaf) {
      margin-left: 12px;
      margin-right: 6px;
    }
  }
}
</style>
