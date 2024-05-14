<template>
  <div class="manage-panel">
    <div class="manage-panel-search">
      <tiny-search
        v-model="state.searchValue"
        clearable
        placeholder="请输入关键字搜索"
        @update:modelValue="searchBridgeData"
      >
        <template #prefix>
          <tiny-icon-search />
        </template>
      </tiny-search>
    </div>
    <div class="list">
      <div
        v-for="(item, index) in list"
        :key="item.name"
        :class="['list-item', index === state.activeIndex ? 'active' : '']"
        @click.stop="openEdit(item, index)"
      >
        <svg-icon name="resources"></svg-icon>
        <div class="item-label">{{ item.name }}</div>
        <svg-icon class="setting-icon" name="setting" @click.stop="openEdit(item, index)"></svg-icon>
      </div>
      <search-empty :isShow="!list.length" />
    </div>
  </div>
</template>

<script>
import { watchEffect, ref, reactive } from 'vue'
import { Search } from '@opentiny/vue'
import { iconSearch } from '@opentiny/vue-icon'
import { SearchEmpty } from '@opentiny/tiny-engine-common'
import {
  RESOURCE_TYPE,
  ACTION_TYPE,
  getResourcesByType,
  setType,
  setActionType,
  setResource,
  setCategory,
  getType,
  setResourceNamesByType
} from './js/resource'

export default {
  components: {
    TinySearch: Search,
    TinyIconSearch: iconSearch(),
    SearchEmpty
  },
  props: {
    name: {
      type: String,
      default: RESOURCE_TYPE.Util
    }
  },
  emits: ['open'],
  setup(props, { emit }) {
    const list = ref([])
    const state = reactive({
      resourceList: [],
      activeIndex: -1,
      searchValue: ''
    })

    const filterResourceSearchValue = (resourceList = state.resourceList, searchValue = state.searchValue) =>
      resourceList.filter((item) => item.name.toLowerCase().indexOf(searchValue.toLowerCase()) > -1)

    const refresh = async (name) => {
      state.resourceList = await getResourcesByType(name)
      setResourceNamesByType(
        name,
        Array.isArray(state.resourceList) ? state.resourceList.map((resource) => resource.name) : []
      )
      list.value = filterResourceSearchValue(state.resourceList)
    }

    watchEffect(async () => {
      refresh(props.name)
    })

    const add = (type) => {
      setActionType('')
      setType(props.name)
      setResource('')
      setCategory(type)
      emit('open')
    }

    const openRead = (item, index) => {
      state.activeIndex = index
      setResource(item)
      setActionType(ACTION_TYPE.Edit)
      emit('open')
    }

    const openEdit = (item, index) => {
      state.activeIndex = index
      setResource(item)
      setActionType(ACTION_TYPE.Edit)
      setType(props.name)
      setCategory(item.type)
      emit('open')
    }

    const searchBridgeData = (value) => {
      list.value = filterResourceSearchValue(state.resourceList, value)
    }

    return {
      state,
      list,
      add,
      openRead,
      openEdit,
      refresh,
      getType,
      RESOURCE_TYPE,
      searchBridgeData
    }
  }
}
</script>

<style lang="less" scoped>
.manage-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;

  .manage-panel-search {
    padding: 8px;
  }

  .add-button {
    align-self: flex-end;
    margin: 6px;
  }

  .list {
    flex: 1;
    border-top: 1px solid var(--ti-lowcode-tabs-border-color);
    overflow: auto;
  }

  .list-item {
    height: 28px;
    display: grid;
    grid-template-columns: 16px 1fr auto;
    column-gap: 8px;
    align-items: center;
    padding: 0 12px;
    position: relative;
    color: var(--ti-lowcode-bridge-list-color);
    cursor: pointer;
    font-size: 12px;

    &:hover,
    &.active {
      background: var(--ti-lowcode-bridge-list-bg);
    }
    svg {
      color: var(--ti-lowcode-toolbar-more-hover-color);
    }
  }
}
</style>
