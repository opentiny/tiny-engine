<template>
  <div class="blocks-wrap">
    <block-group v-model="state.groups" @changeGroup="changeGroup"></block-group>
    <tiny-search v-model="state.searchValue" clearable placeholder="请输入关键字搜索">
      <template #prefix> <tiny-icon-search /> </template>
    </tiny-search>
    <div class="block-list">
      <block-list v-model:blockList="filterBlocks" :show-add-button="true" :show-block-shot="true"></block-list>
    </div>
  </div>
  <!-- TODO: vue 版本升级到 3.5+ 之后，支持 defer，就不需要 rightPanelRef 了 -->
  <teleport defer to=".material-right-panel" v-if="rightPanelRef">
    <block-group-panel></block-group-panel>
    <block-version-select></block-version-select>
  </teleport>
</template>

<script lang="jsx">
import { onMounted, reactive, watch, provide, computed } from 'vue'
import { Search } from '@opentiny/vue'
import { iconSearch } from '@opentiny/vue-icon'
import { useBlock, useMaterial, useModal, getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'
import BlockGroup from './BlockGroup.vue'
import BlockList from './BlockList.vue'
import BlockGroupPanel from './BlockGroupPanel.vue'
import BlockVersionSelect from './BlockVersionSelect.vue'
import { fetchGroups, fetchGroupBlocksById, fetchGroupBlocksByIds } from './http'
import metaData from '../meta'
import { setBlockPanelVisible, setBlockVersionPanelVisible } from './js/usePanel'

export default {
  components: {
    TinySearch: Search,
    TinyIconSearch: iconSearch(),
    BlockGroup,
    BlockList,
    BlockGroupPanel,
    BlockVersionSelect
  },
  props: {
    activeTabName: {
      type: String,
      default: ''
    },
    rightPanelRef: Object
  },
  setup(props) {
    const { addDefaultGroup, isDefaultGroupId, isAllGroupId, isRefresh, selectedGroup } = useBlock()
    const { materialState } = useMaterial()
    const { message } = useModal()
    const getAppId = () => getMetaApi(META_SERVICE.GlobalService).getBaseInfo().id

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
        const blocks = materialState.blocks[0]?.children || []
        state.groupData = value ? blocks.filter((item) => new RegExp(value, 'i').test(item?.label)) : blocks
        state.groupData.forEach((block) => {
          block.isDefaultGroup = true
        })
      } else if (isAllGroupId(groupId)) {
        const groupIds = state.groups.map((item) => item.value.groupId).filter((id) => typeof id === 'number')
        const innerBlocks = materialState.blocks[0]?.children || []
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

    watch(
      () => props.activeTabName,
      (value) => {
        if (value !== metaData.id) {
          setBlockPanelVisible(false)
          setBlockVersionPanelVisible(false)
        }
      }
    )

    onMounted(() => {
      fetchGroups(getAppId())
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
    padding: 0 12px 12px 12px;
    border-bottom: 1px solid var(--te-materials-block-panel-border-color);
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

.block-list {
  padding: 12px;
  overflow-y: auto;
}
</style>
