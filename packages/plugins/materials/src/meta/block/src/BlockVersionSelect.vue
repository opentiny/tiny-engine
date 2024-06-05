<template>
  <plugin-setting v-if="panel.created" v-show="panel.show" :title="state.title" class="version-list-panel">
    <template #header>
      <tiny-button type="primary" @click="selectVersion">确定</tiny-button>
      <close-icon class="close-icon" @click="closePanel"></close-icon>
    </template>
    <template #content>
      <tiny-grid ref="versionGrid" :data="state.backupList" :show-header="false" class="stripe-tiny-grid">
        <tiny-grid-column type="radio" width="60"></tiny-grid-column>
        <tiny-grid-column show-overflow>
          <template v-slot="{ row }">
            <block-history-template
              :is-block-manage="true"
              :blockHistory="row"
              :currentVersion="selectedBlock.current_version"
            ></block-history-template>
          </template>
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
import { PluginSetting, CloseIcon, BlockHistoryTemplate, SearchEmpty } from '@opentiny/tiny-engine-common'
import { useBlock, useModal } from '@opentiny/tiny-engine-controller'
import { fetchBlockById, requestGroupBlockVersion } from './http'
import { useVersionSelectPanel } from './js/usePanel'

export default {
  components: {
    TinyGrid: Grid,
    TinyGridColumn: GridColumn,
    TinyButton: Button,
    PluginSetting,
    BlockHistoryTemplate,
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
          message({ message: `获取区块版本失败: ${error.message || error}`, status: 'error' })
        })
    }

    const selectVersion = () => {
      const selectedRow = versionGrid.value.getRadioRow()

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
                confirm({
                  title: '切换区块版本成功',
                  message: `${selectedBlock.value.label}区块，已切换为${selectedRow.version}版本，修改版本后需要刷新页面才生效，是否刷新页面？`,
                  exec: () => {
                    window.location.reload()
                  }
                })
              })
              .catch((error) => {
                message({
                  message: `${selectedBlock.value.label}区块切换版本失败：${error.message || error}`,
                  status: 'error'
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

    return {
      state,
      selectedBlock,
      selectVersion,
      versionGrid,
      panel,
      closePanel
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
.stripe-tiny-grid {
  :deep(.tiny-grid__body-wrapper) {
    .tiny-grid-body__row {
      &,
      &:not(.row__hover):nth-child(2n) {
        background: var(--ti-lowcode-component-block-version-list-item-bg);
      }
      &:last-child {
        .tiny-grid-body__column {
          border-bottom: 1px solid var(--ti-lowcode-component-block-version-list-item-border-color);
        }
      }
      .tiny-grid-body__column {
        border-top: 1px solid var(--ti-lowcode-component-block-version-list-item-border-color);
      }
    }
  }
}
.close-icon {
  margin-left: 16px;
}
</style>
