<template>
  <plugin-setting
    v-if="isOpen"
    :is-icon-button="false"
    :showIfFullScreen="true"
    title="静态数据管理"
    class="datasource-record-list"
    @cancel="closeRecordList"
    @save="saveRecordList"
    @fullScreenChange="fullScreenChange"
  >
    <template #content>
      <div class="actions">
        <tiny-link
          type="primary"
          class="addButton"
          :underline="false"
          :disabled="!allowCreate"
          @click.stop="insertNewData"
          ><icon-plusCircle class="tiny-svg-size icon-plusCircle"></icon-plusCircle>新增静态数据</tiny-link
        >
        <tiny-link
          type="primary"
          class="importButton"
          :underline="false"
          :disabled="!allowCreate"
          @click.stop="showImportModal(true)"
          ><icon-import class="tiny-svg-size icon-import"></icon-import>批量导入</tiny-link
        >
        <tiny-link
          type="primary"
          class="box-all-delete"
          :underline="false"
          :disabled="state.isBatchDeleteDisable"
          @click.stop="batchDelete"
          ><span class="all-delete">批量删除</span></tiny-link
        >
        <tiny-link type="primary" class="download" :underline="false" @click="download"
          ><icon-download class="tiny-svg-size icon-download"></icon-download>下载导入模板</tiny-link
        >
      </div>
      <div class="record-list-data">
        <tiny-grid
          ref="grid"
          highlight-current-row
          show-overflow
          :show-icon="false"
          :auto-resize="true"
          :edit-config="{ trigger: 'click', mode: 'row', showStatus: false }"
          :edit-rules="state.validRules"
          :data="state.tableData"
          :columns="state.columns"
          column-min-width="150px"
          @edit-closed="editClosed"
          @select-change="handleSelectChange"
          @select-all="handleSelectChange"
        >
          <template #empty>
            <div class="empty-container">
              <svg-icon class="empty-icon" name="empty"></svg-icon>
              <p>
                <span>暂无数据</span>
                <span v-if="isEmptyColumn">
                  <span>，请先</span>
                  <span class="add-column" @click="$emit('edit')">新增字段</span>
                </span>
              </p>
            </div>
          </template>
        </tiny-grid>
        <tiny-pager
          v-if="state.totalData.length > state.pagerConfig.pageSize"
          class="data-source-list-pager"
          layout="prev, pager, next"
          is-before-page-change
          :current-page="state.pagerConfig.currentPage"
          :page-size="state.pagerConfig.pageSize"
          :total="state.pagerConfig.total"
          @before-page-change="handleBeforeChange"
          @current-change="handleCurrentChange"
          @size-change="handleSizeChange"
        >
        </tiny-pager>
      </div>
    </template>
  </plugin-setting>
  <data-source-record-upload
    :showImportModal="state.showImportModal"
    @override="overrideData"
    @merge="mergeData"
    @close="showImportModal(false)"
  ></data-source-record-upload>
</template>

<script lang="jsx">
import { reactive, ref, watchEffect, watch, computed } from 'vue'
import { camelize, capitalize } from '@vue/shared'
import { Grid, Pager, Input, Numeric, DatePicker, Switch, Slider, Link } from '@opentiny/vue'
import { IconPlusCircle, IconImport } from '@opentiny/vue-icon'
import { PluginSetting } from '@opentiny/tiny-engine-common'
import { utils } from '@opentiny/tiny-engine-utils'
import { useModal, useLayout, useNotify, useCanvas } from '@opentiny/tiny-engine-controller'
import useClipboard from 'vue-clipboard3'
import { fetchDataSourceDetail, requestUpdateDataSource } from './js/http'
import { downloadFn, handleImportedData, overrideOrMergeData, getDataAfterPage } from './js/datasource'
import DataSourceRecordUpload from './DataSourceRecordUpload.vue'

let isOpen = ref(false)

export const open = () => {
  isOpen.value = true
}

export const close = () => {
  isOpen.value = false
}

export default {
  components: {
    TinyGrid: Grid,
    PluginSetting,
    TinyPager: Pager,
    DataSourceRecordUpload,
    TinyLink: Link
  },
  props: {
    // 数据源对象
    data: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['edit'],
  setup(props) {
    const grid = ref(null)
    const { confirm } = useModal()
    const { toClipboard } = useClipboard()
    const { layoutState } = useLayout()

    const state = reactive({
      totalData: [],
      tableData: [],
      columns: [],
      showFullScreen: {
        value: false
      },
      upload: {
        importData: []
      },
      isBatchDeleteDisable: true,
      pagerConfig: {
        currentPage: 1,
        pageSize: 10,
        total: 0
      },
      showImportModal: false,
      validRules: {}
    })

    const allowCreate = computed(() => state.columns?.length > 0)
    const isEmptyColumn = computed(() => state.columns?.length <= 0)

    const copyData = async (id) => {
      try {
        await toClipboard(id)
      } catch (e) {
        useNotify({
          message: '复制失败，请尝试手动复制',
          type: 'error'
        })
      }
    }

    const genValidateRules = (columns) => {
      const res = {}

      for (const item of columns) {
        const rules = []
        const { format: { min, max, required } = {}, type, name } = item

        if (required) {
          rules.push({ required: true, message: `${item.name}必填` })
        }

        if ((type === 'string' || item.type === 'number') && max !== 0 && max >= min) {
          rules.push({ min, max, message: `${type === 'string' ? '长度' : '大小'} 在 ${min} - ${max} 之间` })
        }

        res[name] = rules
      }

      return res
    }

    const renderer = (h, { row }) => {
      return (
        <span
          class="copy-data"
          title="复制"
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            copyData(row._id)
          }}
        >
          {row._id}
          <icon-copy></icon-copy>
        </span>
      )
    }

    const editorMap = {
      string: {
        component: Input
      },
      number: {
        component: Numeric,
        attrs: {
          'controls-position': 'right'
        }
      },
      date: {
        component: DatePicker
      },
      link: {
        component: Input
      },
      switch: {
        component: Switch
      },
      slider: {
        component: Slider,
        attrs: {
          class: 'record-list-slider'
        }
      }
    }

    const getMockPageData = async (offset, pageSize) => {
      const res = await fetchDataSourceDetail(props.data.id)
      const columns = res?.data?.columns

      if (Array.isArray(columns) && columns.length > 0) {
        state.validRules = genValidateRules(columns || [])
      }

      // 兼容旧版本 唯一key 为 id 的场景
      const result = res.data.data.map((item) => {
        if (item._id) {
          return item
        }

        return {
          ...item,
          _id: item.id
        }
      })

      state.totalData = result

      const data = result.slice(offset, offset + pageSize)

      return data
    }

    const getGridData = ({ page, forceUseRemoteData }) => {
      const { currentPage, pageSize } = page
      const offset = (currentPage - 1) * pageSize

      return new Promise((resolve, reject) => {
        if (!forceUseRemoteData) {
          let newOffset = offset

          while (newOffset >= state.totalData.length && newOffset > 0) {
            newOffset -= pageSize
          }

          resolve({
            result: state.totalData.slice(newOffset, newOffset + pageSize),
            page: {
              total: state.totalData.length
            }
          })
          return
        }

        getMockPageData(offset, pageSize)
          .then((data) => {
            resolve({
              result: data,
              page: { total: state.totalData.length }
            })
          })
          .catch((err) => {
            reject(err)
          })
      })
    }

    const fetchData = (forceUseRemoteData = false) => {
      return getGridData({ page: state.pagerConfig, forceUseRemoteData }).then(({ result, page }) => {
        state.tableData = result
        state.pagerConfig.total = page.total
      })
    }

    const handleCopy = (rowData) => {
      const columnsKey = state.columns.map(({ name }) => name)
      const newDataEntries = Object.entries(rowData).filter(([key]) => columnsKey.includes(key))
      const newRecord = { ...Object.fromEntries(newDataEntries), _id: utils.guid() }

      grid.value.insert(newRecord)
      state.totalData.unshift(newRecord)
      fetchData()
    }

    const handleDelete = (rowData) => {
      const messageSaved = {
        render: () => (
          <span>
            <span style="color:var(--ti-lowcode-datasource-modal-text-color)">{'您确定要删除该条数据吗?'}</span>
          </span>
        )
      }
      confirm({
        title: '删除数据',
        message: messageSaved,
        exec: () => {
          grid.value.remove(rowData)
          state.totalData = state.totalData.filter(({ _id }) => _id !== rowData._id)
          fetchData()
        }
      })
    }

    watchEffect(() => {
      const { columns, type } = props.data.data
      let newColumns = columns?.map((column) => ({
        ...column,
        title: column.title?.zh_CN || column.title || column.field,
        field: column.name,
        formatText: column.type === 'date' ? 'date' : ''
      }))

      if (type === 'tree') {
        newColumns = [
          {
            title: '_id',
            field: '_id',
            name: '_id',
            type: 'string',
            renderer
          },
          {
            title: '父ID',
            field: '_pid',
            name: '_pid',
            type: 'string'
          },
          ...newColumns
        ]
      }

      newColumns = newColumns?.map((item) => {
        const editor = editorMap[item.type]

        return {
          editor,
          showIcon: false,
          ...item
        }
      })

      if (newColumns?.length > 0) {
        newColumns.unshift({
          width: 60,
          type: 'selection'
        })

        newColumns.push({
          field: 'option',
          title: '操作',
          width: 100,
          fixed: 'right',
          slots: {
            default: ({ row }) => (
              <div class="option-container">
                <Button type="text" size="mini" class="option-button" onClick={() => handleCopy(row)}>
                  复制
                </Button>
                <Button type="text" size="mini" class="option-button" onClick={() => handleDelete(row)}>
                  删除
                </Button>
              </div>
            )
          }
        })
      }
      state.columns = newColumns
    })

    watch(
      () => props.data.name,
      () => {
        state.totalData = []
        state.pagerConfig.currentPage = 1
        fetchData(true).then(() => {
          grid.value?.clearAll?.()
          grid.value?.resetAll?.()
          grid.value?.validate?.()
        })
      }
    )

    // 插入一条新数据
    const insertNewData = () => {
      grid.value.insert({ _id: utils.guid() })
      const data = grid.value.getTableData().fullData[0]
      state.totalData.unshift(data)
      grid.value.setActiveRow(data)
    }

    // 保存表单数据
    const saveRecordFormData = (data) => {
      const {
        name,
        id,
        data: { columns, type, ...other }
      } = props.data

      const requestData = { name, id, data: { columns, type, ...other, data } }

      requestUpdateDataSource(props.data.id, requestData).then((res) => {
        if (!res) {
          return
        }

        const key = `datasource${capitalize(camelize(name))}`
        const pageSchema = useCanvas().canvasApi.value.getSchema()

        if (pageSchema.state[key]) {
          pageSchema.state[key] = data.map(({ _id, ...other }) => other)
        }

        useNotify({
          type: 'success',
          message: '数据源修改成功'
        })

        fetchData(true)
      })
    }

    const saveRecordList = () => {
      grid.value.validate((valid) => {
        if (!valid) {
          return
        }

        const totalData = state.totalData
        const columnsKeys = state.columns.map(({ name }) => name)
        const data = totalData.map((item) =>
          Object.fromEntries(Object.entries(item).filter(([key]) => columnsKeys.includes(key) || key === '_id'))
        )

        saveRecordFormData(data)
      })
    }

    const fullScreenChange = (value) => {
      layoutState.settings.showDesignSettings = !value
    }

    const download = () => {
      downloadFn(state.columns, '静态数据.xlsx')
    }

    const batchDelete = () => {
      const selectedData = grid.value.getSelectRecords().map(({ _id }) => _id)

      if (selectedData.length <= 0) {
        return
      }

      confirm({
        title: '批量删除',
        message: `您确定要删除${selectedData.length}条数据吗？`,
        exec: () => {
          grid.value.removeSelecteds()
          state.totalData = state.totalData.filter(({ _id }) => !selectedData.includes(_id))
          fetchData()
        }
      })
    }

    const syncDataToTotalData = () => {
      const { insertRecords, updateRecords } = grid.value.getRecordset()

      let updatedData = [...insertRecords, ...updateRecords]
      let updatedIds = updatedData.filter(({ _id }) => _id)

      state.totalData = state.totalData.map((item) => {
        if (!updatedIds.includes(item._id)) {
          return item
        }
        return updatedData.find(({ _id }) => _id === item._id)
      })
    }

    const editClosed = () => {
      grid.value.validate((valid) => {
        syncDataToTotalData()
        if (valid) {
          fetchData()
        }
      })
    }

    const showDesignSettings = () => {
      layoutState.settings.showDesignSettings = true
    }

    const closeRecordList = () => {
      showDesignSettings()
      close()
    }

    const handleSelectChange = () => {
      const selectedData = grid.value.getSelectRecords()

      state.isBatchDeleteDisable = selectedData.length <= 0
    }

    const handleBeforeChange = (param) => {
      const { callback, rollback } = param
      grid.value.validate((valid) => {
        if (valid) {
          callback?.()
          return
        }
        rollback?.()
      })
    }

    const handleCurrentChange = (current) => {
      state.pagerConfig.currentPage = current
      fetchData()
    }

    const handleSizeChange = (size) => {
      state.pagerConfig.pageSize = size
      fetchData()
    }

    const showImportModal = (show) => {
      state.showImportModal = show
    }

    const loadData = (state, gridRef, { importData, isOverride }) => {
      const imported = handleImportedData(state.columns, importData)
      const result = overrideOrMergeData(isOverride, state.totalData, imported)
      state.totalData = result
      const data = getDataAfterPage(result, state.pagerConfig)
      gridRef.value.loadData(data)
    }

    const overrideData = ({ importData }) => {
      loadData(state, grid, { importData, isOverride: true })
    }

    const mergeData = ({ importData }) => {
      loadData(state, grid, { importData, isOverride: false })
    }

    return {
      isOpen,
      state,
      grid,
      closeRecordList,
      insertNewData,
      saveRecordFormData,
      getGridData,
      saveRecordList,
      IconPlusCircle: IconPlusCircle(),
      IconImport: IconImport(),
      download,
      showImportModal,
      batchDelete,
      fullScreenChange,
      editClosed,
      allowCreate,
      isEmptyColumn,
      handleSelectChange,
      handleCurrentChange,
      handleSizeChange,
      handleBeforeChange,
      overrideData,
      mergeData
    }
  }
}
</script>

<style lang="less" scoped>
.actions {
  display: flex;
  justify-content: left;
  align-items: center;
  margin: 16px 0 30px 0;
  .box-all-delete {
    margin: 1px 5px 0 5px;
    .all-delete {
      font-size: 14px;
    }
  }
  .download {
    margin: 0 12px;
    font-size: 14px;
    .icon-download {
      margin: 0 1px 4px 0;
      font-size: 16px;
    }
  }
  .addButton {
    margin: 0 12px;
    font-size: 14px;
    .icon-plusCircle {
      margin: 0 1px 4px 0;
      font-size: 16px;
    }
  }
  .importButton {
    margin: 0 12px;
    font-size: 14px;
    .icon-import {
      margin: 0 1px 4px 0;
      font-size: 16px;
    }
  }
}

.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--ti-lowcode-datasource-common-text-color-5);
  .empty-icon {
    width: 50px;
    height: 50px;
    color: var(--ti-lowcode-datasource-common-empty-color);
  }
  .add-column {
    color: var(--ti-lowcode-datasource-json-border-colorr);
    cursor: pointer;
  }
}

.datasource-record-list {
  width: 642px;
  :deep(.option-container) {
    display: flex;
    justify-content: center;
    .option-button {
      padding: 0;
    }
    .option-button + .option-button {
      margin-left: 6px;
    }
  }
}

.record-list-data {
  margin-top: -20px;
  :deep(.tiny-grid) {
    background-color: var(--ti-lowcode-datasource-toolbar-bg);
    .tiny-grid__header-wrapper {
      background-color: var(--ti-lowcode-datasource-toolbar-view-hover-bg);
      .tiny-grid-header__column {
        color: var(--ti-lowcode-datasource-toolbar-breadcrumb-color);
        height: 39px;
      }

      .tiny-grid__repair {
        border-color: var(--ti-lowcode-datasource-tabs-border-color);
      }

      .tiny-grid-resizable.is__line:before {
        background-color: var(--ti-lowcode-datasource-tabs-border-color);
      }
      .tiny-grid-checkbox__icon {
        svg {
          color: var(--ti-lowcode-datasource-common-primary-color);
        }
      }
    }
    .tiny-grid__body-wrapper {
      &::-webkit-scrollbar {
        height: 10px;
      }
      .tiny-grid-body__column {
        height: 44px;
        .copy-data {
          svg {
            margin-left: 5px;
          }
        }
      }

      .tiny-grid-body__row,
      .tiny-grid-body__row:not(.row__hover):nth-child(2n) {
        background-image: linear-gradient(
          -180deg,
          var(--ti-lowcode-datasource-tabs-border-color),
          var(--ti-lowcode-datasource-tabs-border-color)
        );
        background-repeat: no-repeat;
        background-size: 100% 1px;
        background-position: 100% 100%;
        &.row__current {
          background-color: var(--ti-lowcode-datasource-toolbar-view-hover-bg);
        }
      }

      .tiny-grid-body__row {
        &.row__selected {
          .tiny-grid-checkbox__icon {
            svg {
              color: var(--ti-lowcode-datasource-common-primary-color);
              width: 100%;
              height: 100%;
            }
          }
        }
      }
    }

    .tiny-grid__empty-text {
      color: var(--ti-lowcode-datasource-toolbar-breadcrumb-color);
    }
  }

  :deep(.data-source-list-pager) {
    padding-right: 8px;
    .tiny-pager__pages {
      li.is-active {
        background-color: var(--ti-lowcode-datasource-dialog-demo-border-color);
      }
      li {
        &:not(.dot):not(.is-active):hover {
          background-color: var(--ti-lowcode-datasource-common-hover-bg-1);
          color: var(--ti-lowcode-datasource-common-primary-text-color);
        }
      }
    }
    .tiny-pager__pull-left {
      color: var(--ti-lowcode-datasource-toolbar-breadcrumb-color);
    }
    .tiny-pager__btn-next,
    .tiny-pager__btn-prev {
      &:not([disabled]):hover {
        background-color: var(--ti-lowcode-datasource-icon-hover-bg);

        svg {
          color: var(--ti-lowcode-datasource-toolbar-icon-color);
        }
      }
    }
  }
}
</style>
