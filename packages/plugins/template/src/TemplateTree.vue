<template>
  <div class="app-manage-search">
    <tiny-search v-model="state.templateSearchValue" clearable placeholder="搜索模板"
      @update:modelValue="searchTemplateData"></tiny-search>
  </div>

  <div class="tree-container app-manage-tree">
    <tiny-tree ref="templateTreeRefs" :data="templateSettingState.templates" node-key="id" highlight-current
      current-node-key="1-1" :props="{ children: 'children', label: 'name' }"
      :filter-node-method="filterTemplateTreeData" :expand-on-click-node="false" :shrink-icon="shrinkIcon"
      :expand-icon="expandIcon" @current-change="currentChange" default-expand-all>
      <template #operation="{ node }">
        <div style="width: 80px; text-align: right">
          <tiny-dropdown size="mini" trigger="click" :show-icon="false" :visible-arrow="true">
            <SvgIcon name="setting" class="setting"></SvgIcon>
            <template #dropdown>
              <tiny-dropdown-menu popper-class="my-class">
                <tiny-dropdown-item v-if="!node.data.isTemplate" @click="addTemplate(node)">新增</tiny-dropdown-item>
                <tiny-dropdown-item @click="editTemplate(node)">编辑</tiny-dropdown-item>
                <tiny-dropdown-item v-if="node.data.id !== '0000000000000000'"
                  @click="deleteTemplate(node)">删除</tiny-dropdown-item>
                <tiny-dropdown-item @click="generatePage(node)">生成页面</tiny-dropdown-item>
              </tiny-dropdown-menu>
            </template>
          </tiny-dropdown>
        </div>
      </template>
      <template #prefix="{ node }">
        <div class="prefix-folder-icon" v-if="!node.data.isTemplate && !node.data.children.length">
          <SvgIcon name="text-page-folder-closed" class="folder-icon"></SvgIcon>
        </div>
      </template>
    </tiny-tree>
  </div>
</template>

<script lang="jsx">
import { reactive, ref, watchEffect } from 'vue'
import { Search, Tree } from '@opentiny/vue'
import {
  Dropdown as TinyDropdown,
  DropdownMenu as TinyDropdownMenu,
  DropdownItem as TinyDropdownItem
} from '@opentiny/vue'
import { IconFolderOpened, IconFolderClosed } from '@opentiny/vue-icon'
import { useCanvas, useApp, useModal, useTemplate, useBreadcrumb, useLayout, useNotify } from '@opentiny/tiny-engine-controller'
import { getCanvasStatus } from '@opentiny/tiny-engine-controller/js/canvas'
import { constants } from '@opentiny/tiny-engine-utils'
import { closeTemplateSettingPanel } from './TemplateSetting.vue'
import http, { requestDeleteTemplate } from './http.js'

const { COMPONENT_NAME } = constants

export default {
  components: {
    TinySearch: Search,
    TinyTree: Tree,
    TinyDropdown,
    TinyDropdownMenu,
    TinyDropdownItem
  },
  props: {

  },
  emits: ['openSettingPanel', 'add'],
  setup(props, { emit }) {
    const { appInfoState } = useApp()
    const { confirm } = useModal()
    const { initData, pageState } = useCanvas()
    const { templateSettingState } =
      useTemplate()
    const { fetchTemplateList, fetchTemplateDetail } = http
    const { setBreadcrumbPage } = useBreadcrumb()
    const templateTreeRefs = ref([])

    const state = reactive({
      templateSearchValue: '',
      currentNodeData: {}
    })
    const formatTreeData = (data) => {
      const map = {};
      const tree = [];

      data.forEach(item => {
        map[item.id] = { ...item, children: [] };
      });

      data.forEach(item => {
        if (item.parentId) {
          const parent = map[item.parentId];
          if (parent) {
            parent.children.push(map[item.id]);
          }
        } else {
          tree.push(map[item.id]);
        }
      });
      templateSettingState.treeDataMapping = map

      return tree;
    }
    const searchTemplateData = (value) => {
      templateTreeRefs.value.filter(value)
    }
    const refreshTemplateList = async (appId, data) => {
      const templateData = data ? data : await fetchTemplateList(appId)
      templateSettingState.templates = formatTreeData(templateData)
      return templateSettingState.templates
    }

    templateSettingState.updateTreeData = async () => {
      const templateList = await refreshTemplateList(appInfoState.selectedId)
      return templateList
    }
    const clearCurrentState = () => {
      pageState.currentVm = null
      pageState.hoverVm = null
      pageState.properties = {}
      pageState.pageSchema = null
    }
    const updateUrlTemplateId = (id) => {
      const url = new URL(window.location)

      url.searchParams.delete('blockid')
      url.searchParams.set('pageid', id)
      window.history.pushState({}, '', url)
    }
    const getTemplateDetail = (templateId) => {
      if (templateId !== 0 && !templateId) {
        updateUrlTemplateId('')
        initData({ componentName: COMPONENT_NAME.Template }, {})
        useLayout().layoutState.pageStatus = {
          state: 'empty',
          data: {}
        }

        return
      }

      fetchTemplateDetail(templateId).then((data) => {
        updateUrlTemplateId(templateId)
        closeTemplateSettingPanel()
        useLayout().closePlugin()
        useLayout().layoutState.pageStatus = getCanvasStatus(data.occupier)
        initData(data['page_content'], data)
      })
    }

    const switchTemplate = (data) => {
      pageState.hoverVm = null
      state.currentNodeData = data

      let pageName = ''
      if (data.isTemplate) {
        pageName = data?.name || ''
      }
      setBreadcrumbPage([pageName])

      // 切换页面时清空 选中节点信息状态
      clearCurrentState()
      getTemplateDetail(data.id)
    }






    watchEffect(() => {
      if (appInfoState.selectedId) {
        refreshTemplateList(appInfoState.selectedId)
      }
    })

    const filterTemplateTreeData = (value, data) => {
      if (!value) return true

      return data.name?.toLowerCase().indexOf(value?.toLowerCase()) !== -1
    }

    const getTemplateTreeRefs = (el) => {
      if (el) {
        templateTreeRefs.value.push(el)
      }
    }


    const expandIcon = <SvgIcon name="text-page-folder-closed" class="folder-icon"></SvgIcon>

    const shrinkIcon = <SvgIcon name="text-page-folder" class="folder-icon"></SvgIcon>


    function getResultById(id) {
      // 节点数据
      const data = templateTreeRefs.value.getCurrentNode()
      // 节点对象
      const node = templateTreeRefs.value.getNode(id)
      // 节点node-key
      const nodeKey = templateTreeRefs.value.getCurrentKey()
      // 组件内部生成的节点唯一键值
      const innerKey = templateTreeRefs.value.getNodeKey(node)
      // 整个路径上节点数据的数组
      const nodePath = templateTreeRefs.value.getNodePath(id)
      // eslint-disable-next-line no-console
      console.log('当前高亮节点的信息为：', { data, node, nodeKey, innerKey, nodePath })
    }
    // 事件
    function currentChange(data, _currentNode) {
      getResultById(data.id)
    }

    const addTemplate = (node) => {
      emit('openSettingPanel', { node, type: 'add' })
    }

    const editTemplate = (node) => {
      emit('openSettingPanel', { node, type: 'edit' })
    }

    const deleteTemplate = (node) => {

      if (!node.data?.isTemplate && node.data?.children?.length) {
        useNotify({
          type: 'error',
          message: '该模板类型不为空，不能删除！'
        })
        return
      }

      confirm({
        title: '提示',
        message: node.data?.isTemplate ? '您是否要删除该模板?' : '您是否要删除该模板类型',
        exec: () => {
          const id = node.data?.id || ''

          requestDeleteTemplate(id)
            .then(() => {
              templateSettingState.updateTreeData()
              useNotify({
                type: 'success',
                message: '删除成功！'
              })
            })
            .catch((error) => {
              useNotify({
                type: 'success',
                title: '删除失败！',
                message: JSON.stringify(error?.message || error)
              })
            })
        }
      })
    }
    const generatePage = (node) => {
      // todo: 生成页面逻辑
      if (node.isLeaf) return
      emit('openSettingPanel', { node, type: 'generate' })
    }
    return {
      state,
      switchTemplate,
      templateSettingState,
      searchTemplateData,
      refreshTemplateList,
      filterTemplateTreeData,
      getTemplateTreeRefs,
      IconFolderOpened: IconFolderOpened(),
      IconFolderClosed: IconFolderClosed(),
      shrinkIcon,
      expandIcon,
      templateTreeRefs,
      currentChange,
      addTemplate,
      editTemplate,
      deleteTemplate,
      generatePage
    }
  }
}
</script>

<style lang="less" scoped>
.app-manage-search {
  padding: 8px 10px;
  border-bottom: 1px solid var(--ti-lowcode-page-manage-search-border-color);
}


.tree-container {
  height: calc(100% - 95px);
  // padding: 4px 10px;
  overflow-y: auto;
  font-size: 14px;
}

.app-manage-tree {
  :deep(.label) {
    // margin-right: 10px;
    // margin-left: 20px;
  }

  :deep(.tiny-tree) {
    .tiny-tree-node__label {
      width: 100%;
      display: flex;
      justify-content: space-between;
      height: 30px;
      line-height: 30px;
      font-size: 14px;

      .page-edit-icon {
        font-size: 16px;
      }
    }

    .tiny-tree-node__content {
      height: 32px;

      .folder-icon {
        color: var(--ti-lowcode-page-manage-content-tips-color);
      }

      .prefix-folder-icon {
        position: relative;
        top: -2px;
        left: -8px;

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

    .setting {
      color: var(--ti-lowcode-page-manage-content-tips-color);
      margin-right: 10px;

      &:hover {
        color: var(--ti-lowcode-page-manage-svg-hover-color);
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
