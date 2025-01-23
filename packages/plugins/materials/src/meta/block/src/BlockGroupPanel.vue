<template>
  <plugin-setting v-if="panel.show" :title="validGroup.groupName" @cancel="closeGroupPanel" @save="addBlocks">
    <template #content>
      <div class="block-add-content">
        <div class="block-add-content-title">区块列表</div>
        <block-group-filters
          :key="validGroup.groupId"
          :filters="state.filters"
          @search="searchBlocks"
        ></block-group-filters>
        <block-group-transfer :blockList="state.blockList">
          <template #search>
            <tiny-search
              class="transfer-order-search"
              v-model="state.searchValue"
              placeholder="请输入关键词"
              @update:modelValue="searchBlocks(state.filterValues)"
            >
              <template #prefix>
                <tiny-icon-search />
              </template>
            </tiny-search>
          </template>
        </block-group-transfer>
      </div>
    </template>
  </plugin-setting>
</template>
<script>
import { reactive, watch, provide, inject, ref } from 'vue'
import { Search } from '@opentiny/vue'
import { iconSearch } from '@opentiny/vue-icon'
import { PluginSetting } from '@opentiny/tiny-engine-common'
import {
  useBlock,
  useModal,
  useResource,
  useNotify,
  getMetaApi,
  META_SERVICE
} from '@opentiny/tiny-engine-meta-register'
import BlockGroupTransfer from './BlockGroupTransfer.vue'
import BlockGroupFilters from './BlockGroupFilters.vue'

import {
  requestUpdateGroup,
  fetchAvailableBlocks,
  fetchGroupBlocksById,
  fetchTags,
  fetchTenants,
  fetchUsers
} from './http'
import { useGroupPanel } from './js/usePanel'

// 因为区块版本绑定在区块分组中，而一个应用有多个区块分组，所以要防止同一个应用中出现绑定重复区块
const blockMap = new Map()
const initGruopBlockMap = (groups = []) => {
  blockMap.clear()
  for (let group of groups) {
    const groupBlock = group?.blocks || []
    for (let block of groupBlock) {
      blockMap.set(block.id, block)
    }
  }
}
const includesBlockInGroups = (blockId) => blockMap.has(blockId)

export default {
  components: {
    TinySearch: Search,
    PluginSetting,
    BlockGroupTransfer,
    BlockGroupFilters,
    TinyIconSearch: iconSearch()
  },
  setup() {
    const {
      isAllGroupId,
      isDefaultGroupId,
      isRefresh,
      selectedGroup,
      selectedBlockArray,
      getGroupList,
      cancelCheckAll
    } = useBlock()
    const { panel, closePanel } = useGroupPanel()
    const { message } = useModal()
    const getAppId = () => getMetaApi(META_SERVICE.GlobalService).getBaseInfo().id
    const panelState = inject('panelState', {})
    const blockUsers = ref([])
    provide('blockUsers', blockUsers)

    const state = reactive({
      searchValue: '',
      blockList: [],
      filters: [
        {
          id: 'publicType',
          name: '按公开范围',
          children: []
        },
        {
          id: 'author',
          name: '按作者',
          children: [],
          usingSelect: true
        },
        {
          id: 'tag',
          name: '按标签',
          children: [],
          usingSelect: true
        }
      ],
      filterValues: {}
    })

    const validGroup = ref({ ...selectedGroup.value })

    watch(
      () => selectedGroup.value.groupId,
      (groupId) => {
        if (groupId && !isAllGroupId(groupId) && !isDefaultGroupId(groupId)) {
          validGroup.value = { ...selectedGroup.value }
        }
      }
    )

    const clearSearchParams = () => {
      state.searchValue = ''
      state.filterValues = {}
    }

    const addBlocks = () => {
      const groupId = validGroup.value.groupId
      fetchGroupBlocksById({ groupId })
        .then((data) => {
          const resData =
            data?.map((item) => ({
              id: item.id,
              version: item.current_version
            })) || []
          const selectedBlocks =
            selectedBlockArray?.value?.map((item) => ({
              id: item.id,
              version: item.latestVersion
            })) || []

          if (selectedBlocks.length === 0) {
            return
          }

          const blocks = [...resData, ...selectedBlocks]

          // 这里把异步请求 return，可以让下面的 catch 捕获到错误
          return requestUpdateGroup({
            id: groupId,
            blocks,
            app: getAppId()
          }).then(() => {
            isRefresh.value = true
            clearSearchParams()
            selectedBlockArray.value.length = 0
            useResource().fetchResource({ isInit: false }) // 添加区块分组，不需要重新init页面或者区块。
            useNotify({
              message: '添加区块成功',
              type: 'success'
            })
            useBlock().isRefresh.value = true
          })
        })
        .catch((error) => {
          message({
            message: `添加区块失败: ${error.message || error}`,
            status: 'error'
          })
        })
        .finally(() => {
          cancelCheckAll()
        })
      panelState.isBlockGroupPanel = false
      closePanel()
    }

    const closeGroupPanel = () => {
      clearSearchParams()
      selectedBlockArray.value.length = 0
      panelState.isBlockGroupPanel = false
      closePanel()
    }

    const selectedBlockFilter = (blocks) => {
      const isInBlockGroup = (block) => includesBlockInGroups(block.id)

      const isSelectedBlock = (block) =>
        selectedBlockArray?.value?.some((selectedBlock) => block.id === selectedBlock.id)

      return blocks.filter((block) => !isInBlockGroup(block) && !isSelectedBlock(block))
    }

    const searchBlocks = (filters) => {
      state.filterValues = filters

      const params = {
        groupId: validGroup.value.groupId,
        label_contains: state.searchValue.trim(),
        tag: filters?.tag,
        publicType: filters?.publicType,
        author: filters?.author
      }
      fetchAvailableBlocks(params)
        .then((data) => {
          state.blockList = selectedBlockFilter(data)
        })
        .catch((error) => {
          message({
            message: `区块搜索失败: ${error.message || error}`,
            status: 'error'
          })
        })
    }

    const fetchBlocks = (groupId) => {
      fetchAvailableBlocks({ groupId })
        .then((data) => {
          initGruopBlockMap(getGroupList())
          state.blockList = selectedBlockFilter(data)
        })
        .catch((error) => {
          message({
            message: `获取可添加区块列表失败: ${error.message || error}`,
            status: 'error'
          })
        })
    }

    const getFilters = () => {
      Promise.allSettled([fetchTenants(), fetchUsers(), fetchTags()]).then((results) => {
        state.filters[0].children = [
          {
            name: '对所有组织开放',
            id: '1'
          },
          {
            name: '对当前组织开放',
            id: '2'
          }
        ]
        state.filters[1].children =
          results[1].status === 'fulfilled'
            ? results[1].value.map((item) => ({
                name: item?.username,
                id: item?.id
              }))
            : []
        state.filters[2].children =
          results[2].status === 'fulfilled' ? results[2].value.map((item) => ({ name: item })) : []
        blockUsers.value = state.filters[1].children
      })
    }

    watch([() => panel.show, () => validGroup.value.groupId], ([show, groupId]) => {
      if (!show) {
        return
      }

      panelState.isBlockGroupPanel = true
      clearSearchParams()
      fetchBlocks(groupId)
      getFilters()
    })

    return {
      validGroup,
      state,
      panel,
      closeGroupPanel,
      addBlocks,
      searchBlocks
    }
  }
}
</script>
<style lang="less" scoped>
.block-add-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  .block-add-content-title {
    font-weight: 700;
    margin-bottom: 12px;
  }
  .transfer-order-search {
    flex: 1;
  }
}

:deep(.plugin-setting-header) {
  .tiny-button {
    width: 40px;
    padding: 0;
    min-width: 40px;
  }
}
</style>
