<template>
  <div class="blocks-wrap">
    <block-group v-model="state.groups" @changeGroup="changeGroup"></block-group>
    <tiny-search v-model="state.searchValue" clearable placeholder="请输入关键字搜索">
      <template #prefix> <tiny-icon-search /> </template>
    </tiny-search>
    <block-list v-model:blockList="filterBlocks" :show-add-button="true" :show-block-shot="true"></block-list>
  </div>
</template>

<script lang="jsx">
import { onMounted, reactive, watch, provide, computed } from 'vue'
import { Search } from '@opentiny/vue'
import { iconSearch } from '@opentiny/vue-icon'
import { useApp, useBlock, useModal, useResource } from '@opentiny/tiny-engine-controller'
import BlockGroup from './BlockGroup.vue'
import BlockList from './BlockList.vue'
import { fetchGroups, fetchGroupBlocksById, fetchGroupBlocksByIds } from './http'

export default {
  components: {
    TinySearch: Search,
    TinyIconSearch: iconSearch(),
    BlockGroup,
    BlockList
  },
  setup() {
    const { addDefaultGroup, isDefaultGroupId, isAllGroupId, isRefresh, selectedGroup } = useBlock()
    const { resState } = useResource()
    const { message } = useModal()
    const appId = useApp().appInfoState.selectedId

    const state = reactive({
      searchValue: '',
      groups: [],
      groupData: []
    })

    const filterBlocks = computed(() => {
      if (!state.searchValue) {
        return state.groupData
      }

      const lowerCaseSearchValue = state.searchValue.toLowerCase()

      return state.groupData.filter((block) => {
        const nameCN = block?.name_cn?.toLowerCase?.() ?? ''
        const label = block?.label?.toLowerCase?.() ?? ''
        const description = block?.description?.toLowerCase?.() ?? ''

        return (
          nameCN.includes(lowerCaseSearchValue) ||
          label.includes(lowerCaseSearchValue) ||
          description.includes(lowerCaseSearchValue)
        )
      })
    })

    const changeGroup = () => {
      state.searchValue = ''
    }

    provide('displayType', 'default')

    // 读取区块
    const fetchBlocks = async (value) => {
      // 设计器默认区块分组的数据从bundle.json取，其他用户自定义分组调接口向数据库查询
      const groupId = selectedGroup.value.groupId
      if (isDefaultGroupId(groupId)) {
        const blocks = resState.blocks[0]?.children || []
        state.groupData = value ? blocks.filter((item) => new RegExp(value, 'i').test(item?.label)) : blocks
        state.groupData.forEach((block) => {
          block.isDefaultGroup = true
        })
      } else if (isAllGroupId(groupId)) {
        const groupIds = state.groups.map((item) => item.value.groupId).filter((id) => typeof id === 'number')
        const innerBlocks = resState.blocks[0]?.children || []
        innerBlocks.forEach((item) => {
          item.isDefaultGroup = true
          item.groupName = '设计器默认区块分组'
        })
        let blocks = []
        try {
          blocks = await fetchGroupBlocksByIds({ groupIds })
        } catch (error) {
          message({ message: `获取区块列表失败: ${error.message || error}`, status: 'error' })
        }
        state.groupData = [...innerBlocks, ...blocks]
      } else {
        fetchGroupBlocksById({ groupId, value })
          .then((data) => {
            state.groupData = data
          })
          .catch((error) => {
            state.groupData = []
            message({ message: `获取区块列表失败: ${error.message || error}`, status: 'error' })
          })
      }
    }

    watch(
      () => selectedGroup.value.groupId,
      // 避免简写带入watch默认参数
      () => fetchBlocks()
    )

    watch(
      () => isRefresh.value,
      (value) => {
        if (value) {
          fetchBlocks()
          isRefresh.value = false
        }
      }
    )

    onMounted(() => {
      fetchGroups(appId)
        .then((data) => {
          const groups = addDefaultGroup(data)
          state.groups.push(...groups)

          fetchBlocks()
        })
        .catch((error) => {
          message({ message: `获取区块列表失败: ${error.message || error}`, status: 'error' })
        })
    })

    return {
      state,
      filterBlocks,
      changeGroup
    }
  }
}
</script>

<style lang="less" scoped>
.blocks-wrap {
  height: 100%;
  display: flex;
  flex-direction: column;
  .tiny-search {
    padding: 12px 8px;
    :deep(.tiny-input__inner) {
      height: 30px;
    }
  }

  :deep(.block-list) {
    .block-item {
      color: #ababab;
    }
  }
}
</style>
