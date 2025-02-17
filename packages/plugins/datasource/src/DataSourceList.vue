<template>
  <div class="datasource-manage-body">
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
              tips="编辑静态数据"
              name="data-edit"
              @mousedown.stop.prevent="openRecordListPanel(item, index)"
            >
            </svg-button>
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
  <data-source-record-list
    :data="state.currentData"
    @edit="openDataSourceForm(dataSourceList[activeIndex], activeIndex)"
    @refresh="refresh()"
  ></data-source-record-list>
</template>

<script>
import { onMounted, reactive, ref } from 'vue'
import { useDataSource, useResource, getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'
import { close as closeRemotePanel } from './DataSourceRemotePanel.vue'
import { close as closeDataSourceForm } from './DataSourceForm.vue'
import DataSourceRecordList, { open as openRecordList } from './DataSourceRecordList.vue'
import { close as closeRecordForm } from './DataSourceRecordForm.vue'
import { fetchDataSourceList, fetchDataSourceDetail, requestUpdateDataSource } from './js/http'
import { close as closeGlobalDataHandler } from './DataSourceGlobalDataHandler.vue'
import { SvgButton } from '@opentiny/tiny-engine-common'

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
    SvgButton,
    DataSourceRecordList
  },
  emits: ['edit'],
  setup(props, { emit }) {
    const state = reactive({
      currentData: { name: '', columns: [], data: [] }
    })

    const { dataSourceState, saveDataSource } = useDataSource()

    onMounted(() => {
      dataSourceList.value = useResource().appSchemaState.dataSource
    })

    // 打开新增数据面板
    const openRecordListPanel = (item, index) => {
      saveDataSource(requestUpdateDataSource).then(() => {
        fetchDataSourceDetail(item.id).then((data) => {
          dataSourceState.dataSource = data
          state.currentData = data
          activeIndex.value = index
          closeRemotePanel()
          closeDataSourceForm()
          closeRecordForm()
          openRecordList()
          closeGlobalDataHandler()
        })
      })
    }

    // 打开数据源新增和修改面板
    const openDataSourceForm = (item, index) => {
      activeIndex.value = index
      fetchDataSourceDetail(item.id).then((data) => {
        emit('edit', data || item)
      })
    }

    return {
      state,
      openRecordListPanel,
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
