<template>
  <plugin-setting v-if="panel.created" v-show="panel.show" :title="state.title" class="version-list-panel">
    <template #header>
      <close-icon class="close-icon" @click="closePanel"></close-icon>
    </template>
    <template #content>
      <tiny-grid ref="versionGrid" :data="state.backupList" :highlight-hover-row="false">
        <tiny-grid-column field="version" title="版本号"></tiny-grid-column>
        <tiny-grid-column title="发布时间">
          <template v-slot="{ row }">
            <span>{{ format(row.updated_at, 'yyyy/MM/dd hh:mm:ss') }}</span>
          </template>
        </tiny-grid-column>
        <tiny-grid-column field="message" title="发布描述"></tiny-grid-column>
        <tiny-grid-column title="操作">
          <template v-slot="{ row }">
            <tiny-button
              type="text"
              text="回退"
              class="fallback-btn"
              :disabled="isCurrentVersion(row)"
              @click="handleChangeVersion(row)"
            ></tiny-button
          ></template>
        </tiny-grid-column>
        <template #empty>
          <search-empty :isShow="true" />
        </template>
      </tiny-grid>
    </template>
  </plugin-setting>
</template>

<script>
import { reactive, watch, ref } from 'vue'
import { Grid, GridColumn, Button } from '@opentiny/vue'
import { format } from '@opentiny/vue-renderless/common/date'
import { PluginSetting, CloseIcon, SearchEmpty } from '@opentiny/tiny-engine-common'
import { useBlock, useModal, useMaterial, useCanvas } from '@opentiny/tiny-engine-meta-register'
import { fetchBlockById, requestGroupBlockVersion } from './http'
import { useVersionSelectPanel } from './js/usePanel'

export default {
  components: {
    TinyGrid: Grid,
    TinyGridColumn: GridColumn,
    TinyButton: Button,
    PluginSetting,
    CloseIcon,
    SearchEmpty
  },
  setup() {
    const { confirm } = useModal()
    const { selectedBlock, isRefresh } = useBlock()
    const { panel, closePanel } = useVersionSelectPanel()
    const { message } = useModal()

    const state = reactive({
      backupList: [],
      title: ''
    })
    const versionGrid = ref(null)

    const fetchHistories = () => {
      fetchBlockById(selectedBlock.value.id)
        .then((data) => {
          state.backupList = data.histories?.reverse?.() || []
        })
        .catch((error) => {
          message({ message: `获取区块版本失败: ${error.message || error}`, title: '区块版本获取失败' })
        })
    }

    const handleChangeVersion = (selectedRow) => {
      if (selectedRow) {
        confirm({
          title: '修改区块版本',
          message: '您确定要修改区块版本吗？',
          exec: () => {
            const params = {
              groupId: selectedBlock.value.groupId,
              blockId: selectedRow.block_id,
              blockVersion: selectedRow.version
            }

            requestGroupBlockVersion(params)
              .then(() => {
                isRefresh.value = true
                closePanel()
                // 刷新缓存
                useMaterial().updateBlockCompileCache()
                // 刷新画布
                useCanvas().canvasApi.value?.updateCanvas()
              })
              .catch((error) => {
                message({
                  title: '切换区块版本失败',
                  message: `${selectedBlock.value.label}区块切换版本失败：${error.message || error}`
                })
              })
          }
        })
      }
    }

    watch([() => panel.show, () => selectedBlock.value], ([panelShow]) => {
      if (panelShow) {
        state.title = `选择版本(${selectedBlock.value.label})`
        versionGrid.value?.clearRadioRow()
        fetchHistories()
      }
    })

    const isCurrentVersion = (blockHistory) => {
      return blockHistory?.version === selectedBlock.value.current_version
    }

    return {
      state,
      selectedBlock,
      versionGrid,
      panel,
      closePanel,
      format,
      isCurrentVersion,
      handleChangeVersion
    }
  }
}
</script>

<style lang="less" scoped>
.version-list-panel {
  :deep(.plugin-setting-header) {
    color: var(--ti-lowcode-component-block-version-list-panel-title-color);
  }
}
.close-icon {
  margin-left: 16px;
}
.tiny-button.tiny-button {
  &.fallback-btn {
    min-width: unset;
    padding: 0;
  }
  &.tiny-button--text.is-disabled {
    color: var(--ti-button-text-color-disabled);
  }
}
</style>
