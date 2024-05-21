<template>
  <plugin-panel class="block-manage" title="区块管理" :isCloseLeft="false" @close="closePanel">
    <template #header>
      <link-button :href="docsUrl"></link-button>
      <svg-button name="add-page" placement="bottom" tips="新建区块" @click="openBlockAdd"></svg-button>
    </template>
    <template #content>
      <div class="app-manage-search">
        <tiny-select
          ref="groupSelect"
          v-model="state.categoryId"
          popper-class="block-popper"
          placeholder="默认展示全部分类"
          filterable
          :filter-method="categoryFilter"
          clearable
          @change="changeCategory"
          @clear="changeCategory"
          @visible-change="handleSelectVisibleChange"
          class="search-select"
        >
          <tiny-option
            v-for="item in categoryList"
            :key="item.id"
            :label="item.name"
            :value="item.id"
            class="block-group-option-item"
          >
            <div class="block-item">
              <span>{{ item.name }}</span>
              <div class="item-btns">
                <svg-button class="item-icon" name="edit" title="编辑" @click.stop="editCategory(item)"></svg-button>
                <tiny-popover
                  :modelValue="state.currentDeleteGroupId === item.id"
                  placement="right"
                  trigger="manual"
                  popper-class="block-category-option-popper-wrapper"
                  @update:modelValue="handleChangeDeletePopoverVisible"
                >
                  <div class="popper-confirm" @mousedown.stop="">
                    <div class="popper-confirm-header">
                      <svg-icon class="icon" name="warning"></svg-icon>
                      <span class="title">您确定删除该区块分类吗？</span>
                    </div>
                    <div class="popper-confirm-footer">
                      <tiny-button class="confirm-btn" size="small" type="primary" @click="delCategory(item.id)"
                        >确定</tiny-button
                      >
                      <tiny-button class="cancel-btn" size="small" @click="handleShowDeleteModal(null)"
                        >取消</tiny-button
                      >
                    </div>
                  </div>
                  <template #reference>
                    <svg-button
                      v-if="!item.blocks.length"
                      class="item-icon"
                      name="delete"
                      title="删除"
                      @click.stop="handleShowDeleteModal(item.id)"
                    ></svg-button>
                  </template>
                </tiny-popover>
              </div>
            </div>
          </tiny-option>
        </tiny-select>
        <svg-button class="add-group-btn" tips="新建分类" name="add-page" @click="createCategory"></svg-button>
      </div>
      <div class="app-manage-search">
        <tiny-search v-model="state.searchKey" placeholder="请输入关键字搜索"></tiny-search>
      </div>
      <plugin-block-list
        class="plugin-block-list"
        :data="state.blockList"
        :isBlockManage="true"
        :showBlockShot="true"
        :blockStyle="state.layout"
        default-icon-tip="查看区块"
        :externalBlock="externalBlock"
        @click="editBlock"
        @iconClick="openSettingPanel"
      ></plugin-block-list>
      <block-setting></block-setting>
      <div class="block-footer">
        <tiny-dropdown trigger="click" @item-click="changeType">
          <span>
            <span>{{ state.sortTypeLabel }}</span>
          </span>
          <template #dropdown>
            <tiny-dropdown-menu
              popper-class="my-class"
              placement="top"
              :options="state.sortOptions"
            ></tiny-dropdown-menu>
          </template>
        </tiny-dropdown>
        <block-group-arrange v-model="state.layout" :arrangeList="state.arrangeList"></block-group-arrange>
      </div>
    </template>
  </plugin-panel>
  <category-edit v-model="state.editVisible" :initialValue="state.groupInitialValue"></category-edit>
  <save-new-block :boxVisibility="boxVisibility" @close="close"></save-new-block>
</template>

<script lang="jsx">
import { ref, reactive, computed, watch } from 'vue'
import {
  Search as TinySearch,
  Select as TinySelect,
  Option as TinyOption,
  Dropdown as TinyDropdown,
  DropdownMenu as TinyDropdownMenu,
  Popover as TinyPopover,
  Button as TinyButton
} from '@opentiny/vue'
import { PluginPanel, PluginBlockList, SvgButton, SaveNewBlock, LinkButton } from '@opentiny/tiny-engine-common'
import { useBlock, useModal, useLayout, useCanvas, useHelp } from '@opentiny/tiny-engine-controller'
import { constants } from '@opentiny/tiny-engine-utils'
import BlockSetting, { openPanel, closePanel } from './BlockSetting.vue'
import BlockGroupArrange from './BlockGroupArrange.vue'
import CategoryEdit from './CategoryEdit.vue'
import {
  saveBlock,
  initEditBlock,
  mountedHook,
  refreshBlockData,
  getBlockById,
  getBlockContentByLabel,
  getBlockBase64,
  updateBlockList,
  delCategory,
  getEditBlock,
  publishBlock
} from './js/blockSetting'
import { fetchBlockList, requestBlocks, requestInitBlocks, fetchBlockContent } from './js/http'

const docsUrl = useHelp().getDocsUrl('block')
const { SORT_TYPE } = constants
const externalBlock = ref(null) // 外部区块信息，用作激活外部传入的区块样式

const openSettingPanel = async ({ isOpen = true, item: block = {} }) => {
  externalBlock.value = block

  // 如果需要设置的区块和当前画布渲染的区块不是同一区块就去刷新下这个区块的数据
  if (block?.id !== useBlock().getCurrentBlock()?.id) {
    await refreshBlockData(block)
  }

  // 初始化区块设置面板的数据
  initEditBlock(block)
  if (isOpen) {
    openPanel()
  }
}

export const api = {
  fetchBlockList,
  openSettingPanel,
  saveBlock,
  getBlockById,
  getBlockContentByLabel,
  requestBlocks,
  refreshBlockData,
  useBlock,
  requestInitBlocks,
  getBlockBase64,
  fetchBlockContent,
  getEditBlock,
  publishBlock
}

export default {
  components: {
    TinySearch,
    TinySelect,
    TinyOption,
    SvgButton,
    LinkButton,
    TinyDropdown,
    TinyDropdownMenu,
    PluginPanel,
    SaveNewBlock,
    BlockSetting,
    BlockGroupArrange,
    CategoryEdit,
    PluginBlockList,
    TinyPopover,
    TinyButton
  },

  setup() {
    const { getBlockList, sort } = useBlock()
    const { isSaved } = useCanvas()
    const { confirm } = useModal()
    const formData = reactive({
      name: '',
      path: '',
      nameCn: ''
    })

    const state = reactive({
      searchKey: '',
      categoryId: '',
      groupValueCache: '',
      sortTypeLabel: '按时间倒序',
      sortType: 'timeDesc',
      publishFilterType: '',
      sortOptions: [
        { label: '按时间正序', value: SORT_TYPE.timeAsc },
        { label: '按时间倒序', value: SORT_TYPE.timeDesc },
        { label: '按字母正序', value: SORT_TYPE.alphabetAsc },
        { label: '按字母倒序', value: SORT_TYPE.alphabetDesc },
        { label: '已发布', value: 'published' },
        { label: '未发布', value: 'draft' }
      ],
      editVisible: false,
      groupInitialValue: {},
      layout: 'default',
      arrangeList: [
        {
          id: 'default',
          name: '栅格',
          svgName: 'grid'
        },
        {
          id: 'mini',
          name: '列表',
          svgName: 'small-list'
        }
      ],
      curLayout: 'grid',
      blockList: getBlockList(),
      currentDeleteGroupId: null
    })

    const groupSelect = ref(null)

    watch(
      () => [getBlockList(), state.searchKey, state.publishFilterType],
      () => {
        const blockList = getBlockList()
        state.blockList = blockList.filter((item) => {
          let publishFilterFlag = true
          switch (state.publishFilterType) {
            case 'published':
              publishFilterFlag = item.is_published
              break
            case 'draft':
              publishFilterFlag = !item.is_published
              break
            default:
              break
          }

          if (!publishFilterFlag) {
            return false
          }

          const pattern = new RegExp(state.searchKey, 'i')

          return pattern.test(item?.name_cn) || pattern.test(item?.label) || pattern.test(item?.description)
        })
        state.blockList = sort(state.blockList, state.sortType)
      }
    )

    const categoryList = computed(() => useBlock().getCategoryList())

    mountedHook()
    const boxVisibility = ref(false)
    const openBlockAdd = () => {
      boxVisibility.value = true
    }
    const close = () => {
      boxVisibility.value = false
    }
    const editBlock = async (block) => {
      const isEdite = true
      if (isSaved()) {
        await refreshBlockData(block)
        useBlock().initBlock(block, {}, isEdite)
        useLayout().closePlugin()
        closePanel()
        const url = new URL(window.location)
        url.searchParams.delete('pageid')
        url.searchParams.set('blockid', block.id)
        window.history.pushState({}, '', url)
      } else {
        confirm({
          message: '当前画布内容尚未保存，是否要继续切换?',
          exec: async () => {
            await refreshBlockData(block)
            useBlock().initBlock(block, {}, isEdite)
            useLayout().closePlugin()
            closePanel()
          }
        })
      }
    }

    const categoryFilter = (value, selectRef) => {
      const select = selectRef?.value || groupSelect.value

      if (value) {
        select.state.cachedOptions.forEach((item) => {
          item.state.visible = item.label.indexOf(value) > -1
        })
      } else {
        select.state.cachedOptions.forEach((item) => {
          item.state.visible = true
        })
      }
    }

    const changeCategory = (val) => {
      let params = { categoryId: val }

      if (!val) {
        params = {}
      }

      updateBlockList(params)
    }

    const editCategory = (category) => {
      state.groupInitialValue = category
      state.editVisible = true
      state.currentDeleteGroupId = null
    }

    const createCategory = () => {
      editCategory({})
    }

    const deleteItem = (item) => {
      confirm({
        title: '删除分类',
        status: 'custom',
        message: {
          render() {
            return (
              <div>
                确定要删除
                <b> {item.name} </b>
                吗？删掉后不可恢复！
              </div>
            )
          }
        },
        exec() {
          delCategory(item.id)
        }
      })
    }

    const changeType = ({ itemData }) => {
      const { label, value } = itemData
      state.sortTypeLabel = label
      state.sortType = value

      let type = value
      const filterType = ['published', 'draft']

      if (filterType.includes(type)) {
        state.publishFilterType = type
        type = 'timeDesc'
        state.sortType = type
      } else {
        state.publishFilterType = ''
      }

      state.blockList = sort(state.blockList, type)
    }

    const handleShowDeleteModal = (id) => {
      state.currentDeleteGroupId = id
    }

    const handleChangeDeletePopoverVisible = (visible) => {
      if (!visible) {
        state.currentDeleteGroupId = null
      }
    }

    const handleSelectVisibleChange = (visible) => {
      handleChangeDeletePopoverVisible(visible)
    }

    return {
      state,
      groupSelect,
      categoryList,
      editBlock,
      categoryFilter,
      changeCategory,
      createCategory,
      editCategory,
      deleteItem,
      closePanel,
      openBlockAdd,
      boxVisibility,
      openSettingPanel,
      close,
      formData,
      changeType,
      handleShowDeleteModal,
      delCategory,
      handleChangeDeletePopoverVisible,
      handleSelectVisibleChange,
      externalBlock,
      docsUrl
    }
  }
}
</script>

<style lang="less" scoped>
.app-manage-search {
  padding: 0 10px;
  margin: 12px 0;
  display: flex;
  .search-select {
    flex: 1;
  }
  .add-group-btn {
    display: flex;
    align-items: center;
    text-align: center;
    margin-left: 8px;
    border-color: transparent;
    background-color: var(--ti-lowcode-component-block-list-add-group-btn-bg);
    width: 30px;
    height: 30px;
    border: var(--ti-lowcode-component-block-list-add-group-btn-border);
    border-radius: var(--ti-lowcode-component-block-list-add-group-btn-border-radius);
  }
}
.block-popper {
  .block-group-option-item {
    display: flex;
  }
  .block-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex: 1;
    .item-btns {
      display: none;
    }
    &:hover {
      .item-btns {
        display: block;
      }
    }
  }
  .item-icon {
    font-size: 12px;
  }
}
.plugin-block-list {
  margin-bottom: 40px;
}
.block-footer {
  position: absolute;
  bottom: 0;
  left: -6px;
  right: 0;
  padding: 10px 16px;
  background-color: var(--ti-lowcode-component-search-bg);
  color: var(--ti-lowcode-component-block-list-item-color);
  display: flex;
  justify-content: space-between;
  .footer-layout {
    font-size: 12px;
    color: var(--ti-lowcode-component-block-list-item-color);
    .tiny-svg {
      cursor: pointer;
      margin-left: 8px;
      &.active {
        color: var(--ti-lowcode-icon-bind-color);
      }
    }
  }
  .ml8 {
    margin-left: 8px;
  }
}

:deep(.help-box) {
  position: absolute;
  left: 72px;
  top: 3px;
}
</style>

<style lang="less">
.tiny-popover.tiny-popper.block-category-option-popper-wrapper {
  width: 220px;
  height: 108px;
  box-sizing: border-box;
  background-color: var(--ti-lowcode-materials-block-group-delete-popover-bg-color);
  padding: 6px;

  &[x-placement^='right'] {
    .popper__arrow {
      &,
      &::after {
        border-right-color: var(--ti-lowcode-common-component-hover-bg);
      }
    }
  }

  .popper-confirm {
    padding: 20px;
  }

  .popper-confirm-header {
    font-size: 12px;
    color: var(--ti-lowcode-materials-block-group-delete-popover-title-color);
    .icon {
      color: var(--ti-lowcode-warning-color);
      width: 16px;
      height: 16px;
    }
    .title {
      margin-left: 4px;
    }
  }
  .popper-confirm-footer {
    text-align: center;
    margin-top: 22px;
  }
}
</style>
