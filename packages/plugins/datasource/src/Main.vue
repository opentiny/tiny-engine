<template>
  <plugin-panel
    title="数据源"
    class="plugin-datasource"
    :fixed-name="PLUGIN_NAME.Collections"
    :fixedPanels="fixedPanels"
    :docsUrl="docsUrl"
    :docsContent="docsContent"
    :isShowDocsIcon="true"
    @close="$emit('close')"
  >
    <template #header>
      <svg-button
        class="set-data-source"
        tips="全局设置"
        name="global-setting"
        @click="openGlobalDataHanderPanel"
      ></svg-button>
      <svg-button
        class="refresh-data-source"
        tips="刷新数据源"
        name="flow-refresh"
        @click="refreshDataSource"
      ></svg-button>
    </template>
    <template #content>
      <tiny-button class="add-data-source" @click="openDataSourceFormPanel()">
        <svg-icon name="add"></svg-icon>添加数据源
      </tiny-button>
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

<script lang="ts">
import { reactive, watch, provide } from 'vue'
import { Button } from '@opentiny/vue'
import DataSourceList, { refresh as refreshDataSourceList, clearActive } from './DataSourceList.vue'
import DataSourceRemotePanel, {
  close as closeRemotePanel,
  isOpen as isOpenRemotePanel
} from './DataSourceRemotePanel.vue'
import { PluginPanel, SvgButton } from '@opentiny/tiny-engine-common'
import DataSourceForm, { open as openDataSourceForm, close as closeDataSourceForm } from './DataSourceForm.vue'
import { close as closeRecordList } from './DataSourceRecordList.vue'
import { close as closeRecordForm } from './DataSourceRecordForm.vue'
import DataSourceRemoteMapping, { isOpen as isOpenSourceRemoteMapping } from './DataSourceRemoteMapping.vue'
import { useDataSource, useHelp, useLayout } from '@opentiny/tiny-engine-meta-register'
import { requestUpdateDataSource } from './js/http'
import DataSourceGlobalDataHandler, {
  open as openGlobalDataHander,
  close as closeGlobalDataHandler
} from './DataSourceGlobalDataHandler.vue'

export default {
  components: {
    TinyButton: Button,
    DataSourceList,
    DataSourceRemotePanel,
    DataSourceRemoteMapping,
    DataSourceGlobalDataHandler,
    PluginPanel,
    DataSourceForm,
    SvgButton
  },
  props: {
    fixedPanels: {
      type: Array
    }
  },
  setup(props, { emit }) {
    const docsUrl = useHelp().getDocsUrl('datasource')
    const docsContent =
      '用来配合画布中组件/区块渲染，便捷地应用于表格组件的表格列，也可灵活地应用于手动调用指定的远程API。'
    const state = reactive({
      editable: true,
      currentDataSource: { name: 'untitled', data: { type: 'array', columns: [] } },
      remoteFields: [],
      remoteResponData: {}
    })

    const { PLUGIN_NAME } = useLayout()

    const panelState = reactive({
      emitEvent: emit
    })

    provide('panelState', panelState)

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
      PLUGIN_NAME,
      state,
      open,
      isOpenRemotePanel,
      isOpenSourceRemoteMapping,
      openDataSourceFormPanel,
      getRomoteReponseData,
      refreshDataSource,
      openGlobalDataHanderPanel,
      docsUrl,
      docsContent
    }
  }
}
</script>
<style lang="less" scoped>
.plugin-datasource {
  height: 100%;
}
.add-data-source {
  margin: 0 12px 12px 12px;
  width: calc(100% - 24px);
}
:deep(.help-box) {
  position: absolute;
  left: 48px;
  top: 12px;
}
:deep(.tiny-button) {
  border-radius: 4px;
  height: 24px;
  line-height: 24px;
}
</style>
