<template>
  <plugin-panel title="数据源">
    <template #header>
      <link-button :href="docsUrl"></link-button>
      <svg-button
        class="add-page"
        tips="新建数据源"
        name="text-source-list-add"
        @click="openDataSourceFormPanel()"
        placement="top"
      ></svg-button>
      <svg-button
        class="set-page"
        tips="全局设置"
        name="text-source-setting"
        @click="openGlobalDataHanderPanel"
      ></svg-button>
      <svg-button
        class="refresh-page"
        tips="刷新数据源"
        name="text-source-list-ref"
        @click="refreshDataSource"
      ></svg-button>
    </template>
    <template #content>
      <data-source-list @edit="openDataSourceFormPanel"></data-source-list>
    </template>
  </plugin-panel>
  <data-source-remote-panel
    v-if="isOpenRemotePanel"
    v-model="state.currentDataSource.data"
    :editable="state.editable"
    @confirm="getRomoteReponseData"
  ></data-source-remote-panel>
  <data-source-form
    v-model="state.currentDataSource"
    :editable="state.editable"
    @save="refreshDataSource"
  ></data-source-form>
  <data-source-remote-mapping
    v-if="isOpenSourceRemoteMapping"
    v-model="state.remoteFields"
    :data="state.remoteResponData"
  ></data-source-remote-mapping>
  <data-source-global-data-handler></data-source-global-data-handler>
</template>

<script>
import { reactive, watch } from 'vue'
import DataSourceList, { refresh as refreshDataSourceList, clearActive } from './DataSourceList.vue'
import DataSourceRemotePanel, {
  close as closeRemotePanel,
  isOpen as isOpenRemotePanel
} from './DataSourceRemotePanel.vue'
import { PluginPanel, SvgButton, LinkButton } from '@opentiny/tiny-engine-common'
import DataSourceForm, { open as openDataSourceForm, close as closeDataSourceForm } from './DataSourceForm.vue'
import { close as closeRecordList } from './DataSourceRecordList.vue'
import { close as closeRecordForm } from './DataSourceRecordForm.vue'
import DataSourceRemoteMapping, { isOpen as isOpenSourceRemoteMapping } from './DataSourceRemoteMapping.vue'
import { useDataSource, useHelp } from '@opentiny/tiny-engine-controller'
import { requestUpdateDataSource } from './js/http'
import DataSourceGlobalDataHandler, {
  open as openGlobalDataHander,
  close as closeGlobalDataHandler
} from './DataSourceGlobalDataHandler.vue'

export default {
  components: {
    DataSourceList,
    DataSourceRemotePanel,
    DataSourceRemoteMapping,
    DataSourceGlobalDataHandler,
    PluginPanel,
    DataSourceForm,
    SvgButton,
    LinkButton
  },
  setup() {
    const docsUrl = useHelp().getDocsUrl('datasource')
    const state = reactive({
      editable: true,
      currentDataSource: { name: 'untitled', data: { type: 'array', columns: [] } },
      remoteFields: [],
      remoteResponData: {}
    })

    const { dataSourceState, saveDataSource } = useDataSource()

    watch(
      () => state.remoteFields,
      (value) => {
        const {
          id,
          name,
          data: { columns, type }
        } = state.currentDataSource
        state.currentDataSource = { id, name, data: { type, columns: [...columns, ...value] } }
      }
    )

    const getRomoteReponseData = (data) => {
      state.remoteResponData = data
    }

    const openDataSourceFormPanel = (data) => {
      saveDataSource(requestUpdateDataSource).then(() => {
        state.editable = data !== undefined
        dataSourceState.dataSource = data
        if (data) {
          state.currentDataSource = data
        } else {
          clearActive()
          state.currentDataSource = { name: 'untitled', data: { type: 'array', columns: [] } }
        }
        closeRecordList()
        closeRecordForm()
        openDataSourceForm()
        closeGlobalDataHandler()
        closeRemotePanel()
      })
    }

    const openGlobalDataHanderPanel = () => {
      openGlobalDataHander()
      closeDataSourceForm()
      closeRecordList()
      closeRecordForm()
      closeRemotePanel()
    }

    const refreshDataSource = () => {
      refreshDataSourceList()
      closeRemotePanel()
    }

    return {
      state,
      open,
      isOpenRemotePanel,
      isOpenSourceRemoteMapping,
      openDataSourceFormPanel,
      getRomoteReponseData,
      refreshDataSource,
      openGlobalDataHanderPanel,
      docsUrl
    }
  }
}
</script>
<style lang="less" scoped>
.add-page,
.set-page,
.refresh-page {
  width: 16px;
  margin-right: 6px !important;
  color: var(--ti-lowcode-datasource-btn-click-color);
}
:deep(.help-box) {
  position: absolute;
  left: 58px;
  top: 3px;
}
</style>
