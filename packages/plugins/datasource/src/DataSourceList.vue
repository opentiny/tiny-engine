<template>
  <div class="datasource-manage-body">
    <div class="datasource-list">
      <div
        v-for="(item, index) in dataSourceList"
        :key="item.id"
        :class="['datasource-list-item', index === activeIndex ? 'active' : '']"
        @mouseenter="showSettingIcon(index)"
        @mousedown.stop="openRecordListPanel(item, index)"
      >
        <div class="item-label">
          {{ item.name }}
          <div class="item-handler">
            <svg-button
              class="set-page"
              tips="设置数据源"
              name="text-source-setting"
              v-if="state.showSetting && index === state.hoverIndex"
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
  ></data-source-record-list>
</template>

<script>
import { onMounted, reactive, ref } from 'vue'
import { useApp, useDataSource, useResource, useCanvas } from '@opentiny/tiny-engine-controller'
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
  const { appInfoState } = useApp()

  const url = new URLSearchParams(location.search)
  const selectedId = appInfoState.selectedId || url.get('id')
  fetchDataSourceList(selectedId).then((data) => {
    dataSourceList.value = data
    useCanvas().canvasApi.value.setDataSourceMap(data)
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
      showSetting: false,
      hoverIndex: 0,
      currentData: { name: '', columns: [], data: [] }
    })

    const { dataSourceState, saveDataSource } = useDataSource()

    onMounted(() => {
      dataSourceList.value = useResource().resState.dataSource
    })

    const showSettingIcon = (itemIndex) => {
      state.hoverIndex = itemIndex
      state.showSetting = true
    }

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
      showSettingIcon,
      openRecordListPanel,
      openDataSourceForm,
      dataSourceList,
      activeIndex
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
  }
  .datasource-list-item {
    box-shadow: var(--ti-lowcode-datasource-tabs-border-color) 0, -1px;
    height: 40px;
    align-items: center;
    display: grid;
    padding-left: 4px;
    padding-right: 12px;
    position: relative;
    color: var(--ti-lowcode-datasource-common-text-main-color);
    cursor: pointer;
    &:hover,
    &.active {
      background: var(--ti-lowcode-datasource-list-hover-color);
    }
    .item-label {
      overflow: hidden;
      text-overflow: ellipsis;
      margin-left: 10px;
      display: flex;
      justify-content: space-between;
    }
    .item-handler {
      svg {
        color: var(--ti-lowcode-datasource-toolbar-more-hover-color);
      }
    }
  }
}
</style>
