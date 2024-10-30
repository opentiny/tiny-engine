<template>
  <div class="app-manage-search">
    <tiny-search
      v-model="state.templateSearchValue"
      clearable
      placeholder="搜索模板"
      @update:modelValue="searchTemplateData"
    ></tiny-search>
  </div>

  <div class="tree-container app-manage-tree">
    <tiny-tree
      ref="templateTreeRefs"
      :data="templateSettingState.templates"
      node-key="id"
      highlight-current
      current-node-key="1-1"
      :props="{ children: 'children', label: 'name' }"
      :filter-node-method="filterTemplateTreeData"
      :expand-on-click-node="false"
      :shrink-icon="shrinkIcon"
      :expand-icon="expandIcon"
      @current-change="handleCurrentChange"
      default-expand-all
    >
      <template #operation="{ node }">
        <div style="width: 80px; text-align: right" @click.stop>
          <tiny-dropdown size="mini" trigger="click" :show-icon="false" :visible-arrow="true">
            <SvgIcon name="setting" class="setting"></SvgIcon>
            <template #dropdown>
              <tiny-dropdown-menu popper-class="my-class">
                <tiny-dropdown-item v-if="!node.data.isTemplate" @click="addTemplate(node)">新增</tiny-dropdown-item>
                <tiny-dropdown-item @click="editTemplate(node)">编辑</tiny-dropdown-item>
                <tiny-dropdown-item v-if="node.data.id !== '0000000000000000'"
                  @click="deleteTemplate(node)">删除</tiny-dropdown-item>
                <tiny-dropdown-item @click="generatePageFromTemplate(node)">生成页面</tiny-dropdown-item>
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
import {
  useCanvas,
  useApp,
  useModal,
  useTemplate,
  useBreadcrumb,
  useLayout,
  useNotify,
  usePage
} from '@opentiny/tiny-engine-controller'
import { getCanvasStatus } from '@opentiny/tiny-engine-controller/js/canvas'
import { constants } from '@opentiny/tiny-engine-utils'
import { closeTemplateSettingPanel } from './TemplateSetting.vue'
import http, { requestDeleteTemplate } from './http.js'
import { isVsCodeEnv } from '@opentiny/tiny-engine-controller/js/environments'
import { handleCreatePage } from '@opentiny/tiny-engine-controller/js/http'
import { generatePage } from '@opentiny/tiny-engine-controller/js/vscodeGenerateFile'

const { COMPONENT_NAME } = constants

export default {
  components: {
    TinySearch: Search,
    TinyTree: Tree,
    TinyDropdown,
    TinyDropdownMenu,
    TinyDropdownItem
  },
  props: {},
  emits: ['openSettingPanel', 'add'],
  setup(props, { emit }) {
    const { appInfoState } = useApp()
    const { confirm } = useModal()
    const { initData, templateState, isBlock, isTemplateSaved, isSaved, setSaved } = useCanvas()
    const { templateSettingState, isCurrentDataSame, changeTreeData, refreshTemplateList } = useTemplate()
    const { fetchTemplateDetail } = http
    const { setBreadcrumbTemplate } = useBreadcrumb()
    const templateTreeRefs = ref([])
    const { resetPageData, DEFAULT_PAGE, STATIC_PAGE_GROUP_ID, pageSettingState } = usePage()

    const state = reactive({
      templateSearchValue: '',
      currentNodeData: {}
    })

    const searchTemplateData = (value) => {
      templateTreeRefs.value.filter(value)
    }

    templateSettingState.updateTreeData = async () => {
      const templateList = await refreshTemplateList(appInfoState.selectedId)
      return templateList
    }

    const clearCurrentState = () => {
      templateState.currentVm = null
      templateState.hoverVm = null
      templateState.properties = {}
      templateState.pageSchema = null
    }

    const updateUrlTemplateId = (id) => {
      const url = new URL(window.location)

      url.searchParams.delete('blockid')
      url.searchParams.delete('pageid')
      url.searchParams.set('templateid', id)

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
        initData(data['template_content'], data)
      })
    }

    const switchTemplate = (data) => {
      resetPageData()

      templateState.hoverVm = null
      state.currentNodeData = data

      let templateName = ''
      if (data.isTemplate) {
        templateName = data?.name || ''
      }
      setBreadcrumbTemplate([templateName])

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

    function handleCurrentChange(data, _currentNode) {
      const { id, isTemplate } = data

      // 区块切换回页面需要重新加载页面
      if ((!isBlock() && id === templateSettingState.currentTemplateData?.id) || !isTemplate) {
        return
      }

      if (isSaved() && isTemplateSaved() && isCurrentDataSame()) {
        switchTemplate(data)
      } else {
        const text = isBlock() ? '区块' : !isSaved() ? '页面' : '模板'

        confirm({
          title: '提示',
          message: `${text}尚未保存，是否要继续切换?`,
          exec: () => {
            setSaved(true)
            changeTreeData(templateSettingState.oldParentId, templateSettingState.currentTemplateData.parentId)
            Object.assign(templateSettingState.currentTemplateData, templateSettingState.currentTemplateDataCopy)
            switchTemplate(data)
          }
        })
      }
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

    const createPage = (data) => {
      const { page_content, ...other } = DEFAULT_PAGE
      const createParams = {
        ...other,
        page_content: {
          ...page_content,
          ...data.template_content,
          componentName: COMPONENT_NAME.Page,
          fileName: data.template_content.fileName
        },
        app: appInfoState.selectedId,
        isPage: true,
        parentId: STATIC_PAGE_GROUP_ID + '',
        name: data.name,
        route: data.name.toLowerCase()
      }

      if (createParams.id) {
        delete createParams.id
        delete createParams._id
      }
      handleCreatePage(createParams)
        .then((data) => {
          useNotify({
            type: 'success',
            message: '生成页面成功，请去页面管理中查看!'
          })
          pageSettingState.updateTreeData()
          if (isVsCodeEnv) {
            generatePage(data)
          }
        })
        .catch((err) => {
          useNotify({
            type: 'error',
            title: '生成页面失败',
            message: JSON.stringify(err?.message || err)
          })
        })
    }

    const generatePageFromTemplate = (node) => {
      if (node.isLeaf) {
        createPage(node.data)
      } else {
        emit('openSettingPanel', { node, type: 'generate' })
      }
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
      handleCurrentChange,
      addTemplate,
      editTemplate,
      deleteTemplate,
      generatePageFromTemplate
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