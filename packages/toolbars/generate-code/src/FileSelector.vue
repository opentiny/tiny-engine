<template>
  <tiny-dialog-box
    class="dialog-box"
    :visible="visible"
    :close-on-click-modal="false"
    :append-to-body="true"
    width="800"
    title="请选择生成到本地的文件"
    @close="$emit('cancel')"
    @open="openDialog"
  >
    <div class="mcp-switch-container">
      <span class="mcp-switch-label">启用 MCP 集成：</span>
      <tiny-switch v-model="mcpEnabled" @change="handleMcpChange"></tiny-switch>
      <span class="mcp-switch-tip">（开启后将生成 MCP 相关配置和工具代码）</span>
    </div>
    <div class="dialog-grid">
      <tiny-grid
        :data="tableData"
        ref="gridRef"
        size="mini"
        :max-height="500"
        :tree-config="{ children: 'children' }"
        :expand-config="{ expandAll: true }"
        :auto-resize="true"
      >
        <tiny-grid-column width="40" tree-node></tiny-grid-column>
        <tiny-grid-column type="selection" width="60"></tiny-grid-column>
        <tiny-grid-column field="fileType" title="文件类型" width="100"></tiny-grid-column>
        <tiny-grid-column field="filePath" title="文件路径" width="250"></tiny-grid-column>
        <tiny-grid-column field="fileContent" title="文件内容" show-overflow="ellipsis"></tiny-grid-column>
      </tiny-grid>
    </div>
    <template #footer>
      <tiny-button type="primary" @click="confirm">确定</tiny-button>
      <tiny-button @click="$emit('cancel')">取消</tiny-button>
    </template>
  </tiny-dialog-box>
</template>

<script lang="ts">
/* metaService: engine.toolbars.generate-code.FileSelector */
import { DialogBox, Button, Grid, GridColumn, Switch } from '@opentiny/vue'
import { computed, ref, nextTick, watch, reactive } from 'vue'
import { useNotify } from '@opentiny/tiny-engine-meta-register'

export default {
  components: {
    TinyDialogBox: DialogBox,
    TinyButton: Button,
    TinyGrid: Grid,
    TinyGridColumn: GridColumn,
    TinySwitch: Switch
  },
  props: {
    visible: { type: Boolean, default: false },
    data: {
      type: Array,
      default: () => []
    },
    enableMcp: { type: Boolean, default: false }
  },
  emits: ['cancel', 'confirm', 'update:enableMcp'],
  setup(props, { emit }) {
    const getTableTreeData = (data: any[]) => {
      const res: any[] = []
      data.forEach((item) => {
        const folder = item.filePath.split('/').slice(0, -1)

        if (!folder.length) {
          res.push(item)
          return
        }

        const parentFolder = folder.reduce((parent: any[], curPath: any) => {
          let curItem = parent.find((parItem) => parItem.path === curPath)

          if (!curItem) {
            curItem = { path: curPath, filePath: curPath, children: [] }
            parent.push(curItem)
          }

          return curItem.children
        }, res)

        parentFolder.push(item)
      })

      return res
    }

    const tableData = computed(() => getTableTreeData(props.data))
    const gridRef = ref<any>(null)

    const state = reactive({})
    const mcpEnabled = ref(props.enableMcp)

    // 监听 props.enableMcp 的变化，同步到本地状态
    watch(
      () => props.enableMcp,
      (newVal) => {
        mcpEnabled.value = newVal
      }
    )

    // 监听 props.data 的变化，重新选中所有项
    watch(
      () => props.data,
      () => {
        nextTick(() => {
          if (gridRef.value) {
            gridRef.value.setAllTreeExpansion(true)
            gridRef.value.setAllSelection(true)
          }
        })
      },
      { deep: true }
    )

    const handleMcpChange = (value: boolean) => {
      emit('update:enableMcp', value)
    }

    const confirm = () => {
      const selectedData = gridRef.value.getSelectRecords().filter((item: { children: any }) => !item.children)
      if (!selectedData?.length) {
        useNotify({
          type: 'error',
          title: '生成代码失败',
          message: '选中列表为空，请先选择需要生成到本地的文件再点击确定按钮.'
        })
        return
      }

      emit('confirm', selectedData)
    }

    const openDialog = () => {
      // 同步 props 到本地状态
      mcpEnabled.value = props.enableMcp

      nextTick(() => {
        if (gridRef.value) {
          gridRef.value.setAllTreeExpansion(true)
          gridRef.value.setAllSelection(true)
        }
      })
    }

    return {
      state,
      tableData,
      gridRef,
      mcpEnabled,
      confirm,
      openDialog,
      handleMcpChange
    }
  }
}
</script>

<style lang="less" scoped>
.mcp-switch-container {
  display: flex;
  align-items: center;
  padding: 12px 0;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--te-toolbars-generate-code-border-color, #ddd);

  .mcp-switch-label {
    font-size: 14px;
    color: var(--te-toolbars-generate-code-text-color);
    margin-right: 8px;
  }

  .mcp-switch-tip {
    font-size: 12px;
    color: var(--te-toolbars-generate-code-text-color-secondary, #999);
    margin-left: 8px;
  }
}

.dialog-box {
  :deep(.tiny-dialog-box__content) {
    background-color: var(--te-toolbars-generate-code-bg-color);

    .tiny-dialog-box__header {
      background-color: var(--te-toolbars-generate-code-bg-color);

      .tiny-dialog-box__title {
        color: var(--te-toolbars-generate-code-text-color);
      }

      .tiny-dialog-box__headerbtn .tiny-dialog-box__close {
        fill: var(--te-toolbars-generate-code-icon-color) !important;

        &:hover {
          fill: var(--te-toolbars-generate-code-icon-color-primary) !important;
        }
      }
    }

    .tiny-dialog-box__footer {
      .tiny-button--primary {
        background-color: var(--te-toolbars-generate-code-bg-color-primary);
        border: none;
      }
    }
  }

  .dialog-grid {
    :deep(.tiny-grid-cell) {
      position: relative;
    }

    :deep(.tiny-grid-tree-wrapper) {
      position: relative;
      top: 2px;
    }

    :deep(.tiny-grid) {
      .tiny-grid__header-wrapper {
        .tiny-grid-header__column {
          color: var(--te-toolbars-generate-code-text-color);
          height: 30px;

          .tiny-grid-resizable.is__line:before {
            background-color: var(--te-toolbars-generate-code-bg-color);
          }
        }

        .tiny-grid-checkbox__icon,
        .icon-checked-sur {
          svg {
            color: var(--te-toolbars-generate-code-border-color-checked) !important;
          }
        }
      }

      .tiny-grid__body-wrapper {
        &::-webkit-scrollbar {
          height: 10px;
        }

        &::-webkit-scrollbar-track-piece {
          background: unset;
        }

        .tiny-grid-body__column {
          height: 32px;
        }

        .tiny-grid-body__row {
          background-color: var(--te-toolbars-generate-code-bg-color);
        }

        .tiny-grid-body__row {
          &.row__selected {
            .tiny-grid-checkbox__icon {
              svg {
                color: var(--te-toolbars-generate-code-border-color-checked);
                fill: currentColor;
                width: 100%;
                height: 100%;
              }
            }
          }
        }
      }

      .tiny-grid__empty-text {
        color: var(--te-toolbars-generate-code-text-color);
      }
    }
  }
}
</style>
