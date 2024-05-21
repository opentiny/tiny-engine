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
        <tiny-grid-column type="selection" width="60" tree-node></tiny-grid-column>
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

<script>
import { DialogBox, Button, Grid, GridColumn } from '@opentiny/vue'
import { reactive, computed, ref, nextTick } from 'vue'
import { useNotify } from '@opentiny/tiny-engine-controller'

export default {
  components: {
    TinyDialogBox: DialogBox,
    TinyButton: Button,
    TinyGrid: Grid,
    TinyGridColumn: GridColumn
  },
  props: {
    visible: { type: Boolean, default: false },
    data: {
      type: Array,
      default: () => []
    }
  },
  emits: ['cancel', 'confirm'],
  setup(props, { emit }) {
    const getTableTreeData = (data) => {
      const res = []
      data.forEach((item) => {
        const folder = item.filePath.split('/').slice(0, -1)

        if (!folder.length) {
          res.push(item)
          return
        }

        const parentFolder = folder.reduce((parent, curPath) => {
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
    const gridRef = ref(null)

    const state = reactive({})

    const confirm = () => {
      const selectedData = gridRef.value.getSelectRecords().filter((item) => !item.children)
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
      nextTick(() => {
        gridRef.value.setAllTreeExpansion(true)
        gridRef.value.setAllSelection(true)
      })
    }

    return {
      state,
      tableData,
      gridRef,
      confirm,
      openDialog
    }
  }
}
</script>

<style lang="less" scoped>
.dialog-box {
  :deep(.tiny-dialog-box__content) {
    background-color: var(--ti-lowcode-common-component-bg);

    .tiny-dialog-box__header {
      background-color: var(--ti-lowcode-common-component-bg);

      .tiny-dialog-box__title {
        color: var(--ti-lowcode-toolbar-breadcrumb-color);
      }

      .tiny-dialog-box__headerbtn .tiny-dialog-box__close {
        fill: var(--ti-lowcode-toolbar-breadcrumb-color) !important;

        &:hover {
          fill: var(--ti-lowcode-common-primary-text-color) !important;
        }
      }
    }

    .tiny-dialog-box__footer {
      .tiny-button--primary {
        background-color: var(--ti-lowcode-common-danger-color, #191919;);
        border: none;
      }
    }
  }

  .dialog-grid {
    :deep(.tiny-grid-tree__indent) {
      width: 0 !important;
    }

    :deep(.tiny-grid-cell) {
      position: relative;
    }

    :deep(.tiny-grid-tree-wrapper) {
      position: relative;
      right: -35px;
      top: 2px;
    }

    :deep(.tiny-grid) {
      .tiny-grid__header-wrapper {
        background-color: var(--ti-lowcode-toolbar-view-hover-bg);

        .tiny-grid-header__column {
          color: var(--ti-lowcode-toolbar-breadcrumb-color);
          height: 30px;

          .tiny-grid-resizable.is__line:before {
            background-color: var(--ti-lowcode-common-component-bg);
          }
        }

        .tiny-grid__repair {
          border-color: var(--ti-lowcode-tabs-border-color);
        }

        .tiny-grid-checkbox__icon {
          svg {
            color: var(--ti-lowcode-common-primary-color);
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

        .tiny-grid-tree-wrapper {
          margin-left: -13px;
          padding-right: 5px;
        }

        .tiny-grid-body__column {
          height: 32px;
          padding-left: 11px;
        }

        .tiny-grid-body__row {
          background-color: var(--ti-lowcode-common-component-bg);
        }

        .tiny-grid-body__row,
        .tiny-grid-body__row:not(.row__hover):nth-child(2n) {
          background-image: linear-gradient(
            -180deg,
            var(--ti-lowcode-new-table-row-sepline-background),
            var(--ti-lowcode-new-table-row-sepline-background)
          );
          background-repeat: no-repeat;
          background-size: 100% 1px;
          background-position: 100% 100%;

          &.row__current {
            background-color: var(--ti-lowcode-toolbar-view-hover-bg);
          }
        }

        .tiny-grid-body__row {
          &.row__selected {
            .tiny-grid-checkbox__icon {
              svg {
                color: var(--ti-lowcode-common-primary-color);
                width: 100%;
                height: 100%;
              }
            }
          }
        }
      }

      .tiny-grid__empty-text {
        color: var(--ti-lowcode-toolbar-breadcrumb-color);
      }
    }
  }
}
</style>
