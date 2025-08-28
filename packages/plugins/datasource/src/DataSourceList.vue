<template>
  <div class="datasource-manage-body lowcode-scrollbar">
    <div class="datasource-list">
      <div
        v-for="(item, index) in dataSourceList"
        :key="item.id"
        :class="['datasource-list-item', index === activeIndex ? 'active' : '']"
      >
        <div class="item-label">
          <div class="item-name">
            <svg-icon name="plugin-icon-data" class="plugin-icon-data"> </svg-icon>
            {{ item.name }}
          </div>
          <div class="item-handler">
            <svg-button
              class="set-page"
              :hoverBgColor="false"
              tips="设置数据源"
              name="setting"
              @mousedown.stop.prevent="openDataSourceForm(item, index)"
            >
            </svg-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
/* metaService: engine.plugins.collections.DataSourceList */
import { onMounted, reactive, ref } from 'vue'
import { useResource, getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'
import { fetchDataSourceList, fetchDataSourceDetail } from './js/http'
import { SvgButton } from '@opentiny/tiny-engine-common'
import { getServiceForm } from './DataSourceRemoteForm.vue'

const dataSourceList = ref([])
const activeIndex = ref(-1)

export const refresh = () => {
  const url = new URLSearchParams(location.search)
  const selectedId = getMetaApi(META_SERVICE.GlobalService).getBaseInfo().id || url.get('id')
  fetchDataSourceList(selectedId).then((data) => {
    dataSourceList.value = data

    useResource().appSchemaState.dataSource = data
  })
}

export const clearActive = () => {
  activeIndex.value = -1
}

export default {
  components: {
    SvgButton
  },
  emits: ['edit'],
  setup(props, { emit }) {
    const state = reactive({
      currentData: { name: '', columns: [], data: [] }
    })

    onMounted(() => {
      dataSourceList.value = useResource().appSchemaState.dataSource
    })

    // 打开数据源新增和修改面板
    const openDataSourceForm = (item, index) => {
      activeIndex.value = index
      fetchDataSourceDetail(item.id).then((data) => {
        const editData = { ...data, data: { ...data.data, type: 'remote' } } || {
          ...item,
          data: { ...item.data, type: 'remote' }
        }
        emit('edit', editData)
        getServiceForm()?.clearValidate()
      })
    }

    return {
      state,
      openDataSourceForm,
      dataSourceList,
      activeIndex,
      refresh
    }
  }
}
</script>

<style lang="less" scoped>
.datasource-manage-body {
  display: flex;
  flex-grow: 1;
  flex-direction: column;
  height: calc(100% - 50px);
  overflow: auto;
  overflow-x: hidden;
  .datasource-list {
    flex-grow: 1;
    padding-top: 12px;
    border-top: 1px solid var(--te-datasource-common-border-color);
  }
  .datasource-list-item {
    box-shadow: var(--te-datasource-tabs-border-color) 0, -1px;
    height: 24px;
    line-height: 24px;
    align-items: center;
    display: grid;
    padding: 0 12px;
    position: relative;
    color: var(--te-datasource-list-main-text-color);
    cursor: pointer;
    &:hover,
    &.active {
      background: var(--te-datasource-list-text-color-hover);
      .item-handler {
        display: inline-block;
      }
    }
    .item-label {
      overflow: hidden;
      text-overflow: ellipsis;
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: var(--te-datasource-list-item-text-color);
      .item-name {
        display: flex;
        align-items: center;
      }
      .plugin-icon-data {
        color: var(--te-datasource-list-item-icon-color);
        margin-right: 8px;
      }
    }
    .item-handler {
      height: 24px;
      line-height: 24px;
      display: none;
    }
  }
}
</style>
