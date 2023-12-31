<template>
  <plugin-setting
    v-if="panel.created"
    v-show="panel.show"
    :title="selectedGroup.groupName"
    @cancel="closeGroupPanel"
    @save="addBlocks"
  >
    <template #content>
      <div class="block-add-content">
        <tiny-search v-model="state.searchValue" placeholder="请输入关键词" @update:modelValue="searchBlocks">
          <template #prefix>
            <tiny-icon-search />
          </template>
        </tiny-search>
        <block-group-filters :filters="state.filters" @search="searchBlocks"></block-group-filters>
        <block-group-transfer v-model:blockList="state.blockList"></block-group-transfer>
      </div>
    </template>
  </plugin-setting>
</template>
<script>
import { nextTick, reactive, watch, inject } from 'vue'
import { Search } from '@opentiny/vue'
import { iconSearch } from '@opentiny/vue-icon'
import { PluginSetting } from '@opentiny/tiny-engine-common'
import { useApp, useBlock, useModal, useResource } from '@opentiny/tiny-engine-controller'
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
    const { isDefaultGroupId, isRefresh, selectedGroup, selectedBlockArray, getGroupList } = useBlock()
    const { panel, closePanel } = useGroupPanel()
    const { message } = useModal()
    const appId = useApp().appInfoState.selectedId
    const panelState = inject('panelState', {})

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
          children: []
        },
        {
          id: 'tag',
          name: '按标签',
          children: []
        }
      ]
    })

    const addBlocks = () => {
      const groupId = selectedGroup.value.groupId
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

          const blocks = [...resData, ...selectedBlocks]

          requestUpdateGroup({
            id: groupId,
            blocks,
            app: appId
          }).then((res) => {
            const selectedId = selectedBlockArray.value.map((b) => b.id)
            const addedBlocks = res.blocks.filter((item) => selectedId.includes(item.id))

            useResource().updateCanvasDependencies(addedBlocks)

            isRefresh.value = true
            state.searchValue = ''
            selectedBlockArray.value.length = 0
            useResource().fetchResource({ isInit: false }) // 添加区块分组，不需要重新init页面或者区块。
          })
        })
        .catch((error) => {
          message({
            message: `添加区块失败: ${error.message || error}`,
            status: 'error'
          })
        })
      panelState.isBlockGroupPanel = false
      closePanel()
    }

    const closeGroupPanel = () => {
      state.searchValue = ''
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

    const searchBlocks = (value, filters) => {
      nextTick(() => {
        const params = {
          groupId: selectedGroup.value.groupId,
          label_contains: state.searchValue,
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
      })
    }

    const fetchBlocks = () => {
      const groupId = selectedGroup.value.groupId
      if (!groupId || isDefaultGroupId(groupId)) return

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
      const groupId = selectedGroup.value.groupId
      if (!groupId || isDefaultGroupId(groupId)) {
        return
      }
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
      })
    }

    watch([() => panel.show, () => selectedGroup.value.groupId], (values) => {
      if (values[0]) {
        panelState.isBlockGroupPanel = true
        fetchBlocks()
        getFilters()
      }
    })

    return {
      selectedGroup,
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
.tiny-search {
  padding: 10px;
}

.block-add-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}
</style>
