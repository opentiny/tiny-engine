<template>
  <div class="data-source-setting">
    <tiny-tabs v-model="state.activeTabName" @click="tabClick">
      <tiny-tab-item title="远程配置" name="remote" v-if="showRemote">
        <div>
          <data-source-setting-remote
            v-model="state.dataSource.data"
            :editable="editable"
            @renderRemoteData="renderRemoteData"
          ></data-source-setting-remote>
        </div>
      </tiny-tab-item>
      <tiny-tab-item title="数据源字段" name="field">
        <div>
          <data-source-field v-model="state.dataSource.data.columns" :editable="editable"></data-source-field>
        </div>
      </tiny-tab-item>
      <tiny-tab-item title="静态数据" name="record">
        <data-source-setting-record-list
          :data="state.currentData"
          ref="recordRef"
          @refresh="refresh()"
          @edit="changeTab()"
        ></data-source-setting-record-list>
      </tiny-tab-item>
    </tiny-tabs>
  </div>
</template>

<script lang="tsx">
import { watch, reactive, ref, computed } from 'vue'
import { TinyTabs, TinyTabItem } from '@opentiny/vue'
import { useDataSource, useResource, getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'
import DataSourceSettingRemote from './DataSourceSettingRemote.vue'
import DataSourceField from './DataSourceField.vue'
import DataSourceSettingRecordList from './DataSourceSettingRecordList.vue'
import { close as closeGlobalDataHandler } from './DataSourceGlobalDataHandler.vue'
import { close as closeRemoteResult } from './DataSourceSettingRemoteResult.vue'
import { fetchDataSourceList } from './js/http'

const dataSourceList = ref([])

export const refresh = () => {
  const url = new URLSearchParams(location.search)
  const selectedId = getMetaApi(META_SERVICE.GlobalService).getBaseInfo().id || url.get('id')
  fetchDataSourceList(selectedId).then((data) => {
    dataSourceList.value = data

    useResource().appSchemaState.dataSource = data
  })
}

export default {
  components: {
    TinyTabs,
    TinyTabItem,
    DataSourceSettingRemote,
    DataSourceField,
    DataSourceSettingRecordList
  },
  props: {
    modelValue: {
      type: Object,
      default: () => ({})
    },
    editable: {
      type: Boolean,
      default: true
    },
    activeTabName: {
      type: String,
      default: 'remote'
    }
  },
  setup(props, { emit }) {
    const { dataSourceState } = useDataSource()
    const recordRef = ref(null)

    const state = reactive({
      dataSource: {},
      activeTabName: props.activeTabName,
      currentData: { name: '', columns: [], data: [] }
    })

    const showRemote = computed(() => !state.dataSource.data || state.dataSource.data.type === 'remote')

    const saveRecord = () => {
      return recordRef.value.saveRecordList()
    }

    const changeRecord = () => {
      state.currentData = state.dataSource
      closeRemoteResult()
      closeGlobalDataHandler()
    }

    const changeTab = () => {
      state.activeTabName = 'field'
    }

    const tabClick = (e) => {
      state.activeTabName = e.name
      emit('activeTab', e.name)
      if (e.name === 'record') {
        changeRecord()
      }
    }
    watch(
      () => props.modelValue,
      (value) => {
        state.dataSource = value || {}
        const {
          id,
          name,
          data: { columns, type }
        } = value

        if (!id) {
          return
        }

        const filterColumns = (columns || []).map(({ name, title, type, format }) => ({
          name,
          title,
          type,
          format
        }))

        dataSourceState.dataSourceColumn = { name, type: type || 'remote', columns: filterColumns }
      },
      { immediate: true }
    )

    watch(
      () => props.activeTabName,
      (value) => {
        state.activeTabName = value
      },
      { immediate: true, deep: true }
    )

    const renderRemoteData = (remoteData) => {
      emit('renderRemoteData', remoteData)
    }
    return {
      state,
      recordRef,
      showRemote,
      tabClick,
      renderRemoteData,
      refresh,
      changeTab,
      saveRecord
    }
  }
}
</script>

<style lang="less" scoped>
.data-source-setting {
  height: 100%;
  transition: 0.3s linear;
  position: relative;
  padding-top: 20px;

  .tiny-tabs {
    height: 100%;
  }
  :deep(.tiny-tabs) {
    display: flex;
    flex-direction: column;
    .tiny-tabs__header .tiny-tabs__nav {
      width: 280px;
      margin-bottom: 16px;
      background-color: var(--te-datasource-settings-tabs-bg-color);
    }
    .tiny-tabs__nav-scroll {
      .tiny-tabs__active-bar {
        height: 3px;
        background-color: var(--te-datasource-settings-tabs-item-color-active);
      }
    }

    .tiny-tabs__content {
      flex: 1;
      overflow-y: auto;
      padding: 0;
      margin: 0;
      &::-webkit-scrollbar-track,
      &::-webkit-scrollbar-track-piece,
      &::-webkit-scrollbar-corner {
        background-color: transparent;
      }

      &::-webkit-scrollbar-thumb {
        background-color: transparent;

        &:hover {
          background-color: transparent;
        }
      }
    }
    .tiny-tabs__nav.is-show-active-bar .tiny-tabs__item {
      margin-right: 8px;
    }
    .tiny-tabs__item {
      flex: 1;
      background-color: var(--te-datasource-settings-bg-color);
      color: var(--te-datasource-settings-text-color);
      margin-right: 5px;
      width: 50px;
      &:hover {
        color: var(--te-datasource-settings-text-color-hover);
      }
      &.is-active {
        color: var(--te-datasource-settings-text-color-active);
        font-weight: var(--te-base-font-weight-4);
        border: none;
      }

      .tiny-tabs__item__title {
        padding-bottom: 6px;
      }
    }

    .tiny-tabs__nav-wrap-not-separator::after {
      z-index: 2;
      background-color: var(--te-datasource-settings-tabs-border-color) !important;
      margin-bottom: 16px;
    }
  }

  :deep(.tiny-collapse-item__content) {
    padding: 0 8px 12px 12px; // 这里的bottom为4px + 内部行元素与底部的距离为8px = 12px
  }
}

.active {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  animation: glow 800ms ease-out infinite alternate;
  transition: opacity 1s linear;
}

@keyframes glow {
  0% {
    box-shadow: inset 0px 0px 4px var(--ti-lowcode-canvas-handle-hover-bg);
  }
  100% {
    box-shadow: inset 0px 0px 14px var(--ti-lowcode-canvas-handle-hover-bg);
  }
}
</style>
